import type { Context } from 'hono';

import { handleWriteCommand } from '../lib/command';
import type {
  Env,
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
  return handleWriteCommand(c, reserveService);
}
