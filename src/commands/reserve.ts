import type { Context } from 'hono';

import { Environments, Services } from '../const';
import { normalizeEnvironments, normalizeServices } from '../lib/params';
import type {
  Env,
  GoogleChatEvent,
  RequestPayload,
  RequestResult,
  ReservationInfo,
} from '../types';

async function reserveService(
  kv: KVNamespace,
  reservation: ReservationInfo,
  payload: RequestPayload,
): Promise<RequestResult> {
  const key = `${payload.environment}-${payload.service}`;
  const current = await kv.get(key);
  if (!current) {
    await kv.put(key, JSON.stringify(reservation));

    return {
      success: true,
      message: `Service \`${payload.service}\` in \`${payload.environment}\` has been successfully reserved.`,
    };
  }

  const { id, email, name } = JSON.parse(current) as ReservationInfo;

  if (id === reservation.id) {
    return {
      success: false,
      message: `You have reserved \`${payload.service}\` in \`${payload.environment}\` already!`,
    };
  }

  return {
    success: false,
    message: `Service \`${payload.service}\` in \`${payload.environment}\` is still being reserved by <https://contacts.google.com/${email}|${name}>. Please ask the user to unreserve it first.`,
  };
}

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message?.text) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  if (params.length === 0) {
    return c.json({
      text: `You need to specify the environment you want to reserve.

Available environment(s):

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  // extract only the first one
  const environments = normalizeEnvironments([params[1]]);

  if (environments.length !== 1) {
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
    .slice(2)
    .map((param) => param.trim())
    .filter(Boolean);

  const services = rawServices.length
    ? normalizeServices(rawServices)
    : Services;
  if (!services.length) {
    return c.json({
      text: `The specified services don't exist!

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

  const results = await Promise.all(
    rawServices.map(async (svc) => {
      if (!services.includes(svc)) {
        return Promise.resolve({
          success: false,
          message: `Service \`${svc}\` doesn't exist in environment \`${environment}\``,
        });
      }

      return reserveService(c.env.ENVIRONMENT_RESERVATION, meta, {
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

${count} of ${rawServices.length} request succeeded.`,
    privateMessageViewer: {
      name: user.name,
    },
  });
}
