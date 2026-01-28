import type { Context } from 'hono';

import { normalizeEnvironments } from '../lib';
import type { Env, GoogleChatEvent } from '../types';

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);
  const environments = normalizeEnvironments(params);

  if (environments.length !== 1) {
    return c.json({
      privateMessageViewer: user,
      formattedText:
        environments.length === 0
          ? "The specified environment doesn't exist!"
          : 'To avoid resource hogging, you *cannot* reserve more than 1 environment at once for now. Please reserve them one by one.',
    });
  }

  const environment = environments[0];

  const meta = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (meta) {
    const { id } = JSON.parse(meta);

    return c.json({
      privateMessageViewer: user,
      formattedText: `Environment \`${environment}\` is still being reserved by <${id}>. Please ask the user to unreserve it first.`,
    });
  }

  const newMeta = JSON.stringify({
    id: user.name,
    since: new Date().toISOString(),
  });
  await c.env.ENVIRONMENT_RESERVATION.put(environment, newMeta);

  return c.json({
    privateMessageViewer: user,
    formattedText: `Environment \`${environment}\` successfully reserved.`,
  });
}
