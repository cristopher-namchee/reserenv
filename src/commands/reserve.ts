import type { Context } from 'hono';

import { Environments } from '../const';
import { normalizeEnvironments } from '../lib/env';
import { sendMessage } from '../lib/google';
import type { Env, GoogleChatEvent } from '../types';

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message?.text) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  if (params.length === 0) {
    return sendMessage(
      c.env,
      user.name,
      `You need to specify the environment you want to reserve.

Available environment(s):

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
    );
  }

  const environments = normalizeEnvironments(params);

  if (environments.length !== 1) {
    const text =
      environments.length === 0
        ? "The specified environment doesn't exist!"
        : 'To avoid resource hogging, you *cannot* reserve more than 1 environment at once for now. Please reserve them one by one.';

    return sendMessage(c.env, user.name, text);
  }

  const environment = environments[0];

  const meta = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (meta) {
    const { id } = JSON.parse(meta);

    const text =
      id === user.name
        ? 'You have this environment reserved already!'
        : `Environment \`${environment}\` is still being reserved by <${id}>. Please ask the user to unreserve it first.`;

    return sendMessage(c.env, user.name, text);
  }

  const newMeta = JSON.stringify({
    id: user.name,
    since: new Date().toISOString(),
  });
  await c.env.ENVIRONMENT_RESERVATION.put(environment, newMeta);

  return sendMessage(
    c.env,
    user.name,
    `Environment \`${environment}\` successfully reserved.`,
  );
}
