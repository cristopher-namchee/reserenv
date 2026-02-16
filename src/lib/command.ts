import type { Context } from 'hono';

import { Environments, Services } from '../const';
import type {
  Env,
  GoogleChatEvent,
  RequestPayload,
  RequestResult,
  ReservationInfo,
} from '../types';
import { normalizeEnvironments, normalizeServices } from './params';

type WriteFn = (
  kv: KVNamespace,
  reservation: ReservationInfo,
  payload: RequestPayload,
) => Promise<RequestResult>;

/**
 * Wrapper for repetitive task for /reserve and /unreserve command.
 *
 * @param {Context} c Hono context
 * @param {WriteFn} fn Function to call on verified request
 * @returns {Promise<Response>} A Hono response
 */
export async function handleWriteCommand(
  c: Context<{ Bindings: Env }>,
  fn: WriteFn,
): Promise<Response> {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message?.text) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  if (params.length === 0) {
    return c.json({
      text: `You need to specify the environment you want to reserve.

Available environments:

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  // extract only the first one
  const environments = normalizeEnvironments([params[0]]);

  if (!environments.length) {
    return c.json({
      text: `The specified environment doesn't exist!

Available environments:

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  const environment = environments[0];
  const rawServices = params
    .slice(1)
    .map((param) => param.trim())
    .filter(Boolean);

  const services = rawServices.length
    ? normalizeServices(rawServices)
    : Services;
  if (!services.length) {
    return c.json({
      text: `The specified service(s) doesn't exist!

Available services:

${Services.map((env) => `- \`${env}\``).join('\n')}`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  const meta: ReservationInfo = {
    id: user.name,
    name: user.displayName,
    email: user.email,
    since: new Date().toISOString(),
  };

  const referenceArray = rawServices.length ? rawServices : Services;

  const results = await Promise.all(
    referenceArray.map(async (svc) => {
      const exist = normalizeServices([svc]);

      if (!exist.length) {
        return Promise.resolve({
          success: false,
          message: `Service \`${svc}\` doesn't exist in environment \`${environment}\``,
        });
      }

      return fn(c.env.ENVIRONMENT_RESERVATION, meta, {
        environment,
        service: svc,
      });
    }),
  );

  const tokens = [];
  let count = 0;

  for (const { message, success } of results) {
    tokens.push(`${success ? '✅' : '❌'} ${message}`);

    if (success) {
      count++;
    }
  }

  return c.json({
    text: `${tokens.join('\n')}

${count} of ${referenceArray.length} request${referenceArray.length > 1 ? 's' : ''} succeeded.`,
    privateMessageViewer: {
      name: user.name,
    },
  });
}
