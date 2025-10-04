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
    await fetch(c.env.SLACK_WEBHOOK_URL, {
      body: JSON.stringify({
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
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return c.text('OK');
  }

  const meta = await c.env.KV.get(environment);

  if (!meta) {
    await fetch(c.env.SLACK_WEBHOOK_URL, {
      body: JSON.stringify({
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
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return c.text('OK');
  }

  const { id } = JSON.parse(meta);
  if (id !== user_id) {
    await fetch(c.env.SLACK_WEBHOOK_URL, {
      body: JSON.stringify({
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
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return c.text('OK');
  }

  await c.env.KV.delete(environment);

  await fetch(c.env.SLACK_WEBHOOK_URL, {
    body: JSON.stringify({
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
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return c.text('OK');
}
