import type { Context } from 'hono';

import { handleWriteCommand } from '../lib/command';
import { formatDate } from '../lib/date';
import type {
  Env,
  RequestPayload,
  RequestResult,
  ReservationInfo,
} from '../types';

async function unreserveService(
  kv: KVNamespace,
  reservation: ReservationInfo,
  payload: RequestPayload,
): Promise<RequestResult> {
  const key = `${payload.environment}-${payload.service}`;
  const current = await kv.get(key);
  if (!current) {
    return {
      success: false,
      message: `Service \`${payload.service}\` in \`${payload.environment}\` is not reserved.`,
    };
  }

  const { id, email, name, since } = JSON.parse(current) as ReservationInfo;

  if (id !== reservation.id) {
    return {
      success: false,
      message: `You cannot unreserve \`${payload.service}\` in \`${payload.environment}\` as it is still being reserved by <https://contacts.google.com/${email}|${name}> since ${formatDate(since)}.`,
    };
  }

  await kv.delete(key);

  return {
    success: true,
    message: `Service \`${payload.service}\` in \`${payload.environment}\` has been successfully unreserved.`,
  };
}

export default async function (c: Context<{ Bindings: Env }>) {
  return handleWriteCommand(c, unreserveService);
}
