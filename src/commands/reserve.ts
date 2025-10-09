import type { Context } from 'hono';

import { normalizeEnvironments } from '../params';
import type { Bindings } from '../types';

export default async function (c: Context<{ Bindings: Bindings }>) {
  const { text, user_id } = await c.req.parseBody();
  if (typeof text !== 'string' || !text.trim() || !user_id) {
    return c.notFound();
  }

  const params = text.split(/\s+/);
  const environments = normalizeEnvironments(params);

  if (environments.length !== 1) {
    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              environments.length === 0
                ? "The specified environment doesn't exist!"
                : 'To avoid resource hogging, you **cannot** reserve more than 1 environment at once for now. Please reserve them one by one.',
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  const environment = environments[0];

  const meta = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (meta) {
    const { id } = JSON.parse(meta);

    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Environment \`${environment}\` is still being reserved by <@${id}>. Please ask the user to unreserve it first.`,
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  const newMeta = JSON.stringify({
    id: user_id,
    since: new Date().toISOString(),
  });
  await c.env.ENVIRONMENT_RESERVATION.put(environment, newMeta);

  return c.json({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Environment \`${environment}\` successfully reserved.`,
        },
      },
    ],
    response_type: 'ephemeral',
  });
}
