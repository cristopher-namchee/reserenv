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
          : 'To avoid accidents, you *cannot* unreserve more than 1 environment at once. Please unreserve them one by one.',
    });
  }

  const environment = environments[0];

  const meta = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (!meta) {
    return c.json({
      privateMessageViewer: user,
      formattedText: `Environment \`${environment}\` is not being reserved.`,
    });
  }

  const { id } = JSON.parse(meta);
  if (id !== user.name) {
    return c.json({
      privateMessageViewer: user,
      formattedText: `You cannot unreserve \`${environment}\` as it is being reserved by <@${id}>`,
    });
  }

  await c.env.ENVIRONMENT_RESERVATION.delete(environment);

  return c.json({
    privateMessageViewer: user,
    formattedText: `Environment \`${environment}\` has been successfully unreserved`,
  });
}
