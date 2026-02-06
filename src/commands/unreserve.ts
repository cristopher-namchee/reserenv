import type { Context } from 'hono';
import { Environments } from '../const';
import { normalizeEnvironments } from '../lib/env';
import type { Env, GoogleChatEvent } from '../types';

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  if (params.length === 0) {
    return c.json({
      text: `You need to specify the environment you want to unreserve.

Available environment(s):

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
    });
  }

  const environments = normalizeEnvironments(params);

  if (environments.length !== 1) {
    return c.json({
      text:
        environments.length === 0
          ? "The specified environment doesn't exist!"
          : 'To avoid accidents, you *cannot* unreserve more than 1 environment at once. Please unreserve them one by one.',
    });
  }

  const environment = environments[0];

  const meta = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (!meta) {
    return c.json({
      text: `Environment \`${environment}\` is not being reserved.`,
    });
  }

  const { id } = JSON.parse(meta);
  if (id !== user.name) {
    return c.json({
      text: `You cannot unreserve \`${environment}\` as it is being reserved by <@${id}>`,
    });
  }

  await c.env.ENVIRONMENT_RESERVATION.delete(environment);

  return c.json({
    text: `Environment \`${environment}\` has been successfully unreserved`,
  });
}
