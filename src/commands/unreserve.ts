import type { Context } from 'hono';
import { normalizeEnvironments } from '../params';
import type { Env } from '../types';

export default async function (c: Context<{ Bindings: Env }>) {
  const { text, user_id } = await c.req.parseBody();
  if (typeof text !== 'string' || !text || !user_id) {
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
                : 'To avoid accidents, you **cannot** unreserve more than 1 environment at once. Please unreserve them one by one.',
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  const environment = environments[0];

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
            text: `You cannot unreserve \`${environment}\` as it is being reserved by <@${id}>`,
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
