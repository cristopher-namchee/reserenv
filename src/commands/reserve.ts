import type { Context } from 'hono';

import { ENVIRONMENTS } from '../constants';
import type { Bindings } from '../types';

export default async function (c: Context<{ Bindings: Bindings }>) {
  const { text, user_id } = await c.req.parseBody();
  if (!text || !user_id || typeof text !== 'string') {
    return c.notFound();
  }

  const params = text.split(/\s+/);
  const environment = params[0];

  if (!ENVIRONMENTS.includes(environment)) {
    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: "The specified environment doesn't exist!",
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  const meta = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (meta) {
    const { id } = JSON.parse(meta);

    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Environment ${environment} is still being reserved by <@U${id}>. Please ask the user to unreserve it first.`,
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
          text: `Environment ${environment} successfully reserved.`,
        },
      },
    ],
    response_type: 'ephemeral',
  });
}
