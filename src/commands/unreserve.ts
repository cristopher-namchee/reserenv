import type { Context } from 'hono';

import { ENVIRONMENTS } from '../constants';
import type { Bindings } from '../types';

export default async function (c: Context<{ Bindings: Bindings }>) {
  const { text, user_id } = await c.req.parseBody();
  if (typeof text !== 'string' || !text || !user_id) {
    return c.notFound();
  }

  const params = text.split(/\s+/);
  const environment = params[0].trim();

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
  if (!meta) {
    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Environment \`${environment}\` is not being reserved.`,
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  const { id } = JSON.parse(meta);
  if (id !== user_id) {
    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `You cannot unreserve \`${environment}\` as it is being reserved by <@U${id}>`,
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  await c.env.ENVIRONMENT_RESERVATION.delete(environment);

  return c.json({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Environment \`${environment}\` has been successfully unreserved`,
        },
      },
    ],
    response_type: 'ephemeral',
  });
}
