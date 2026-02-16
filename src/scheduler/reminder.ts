import { formatDate } from '../lib/date';
import { getGoogleAuthToken } from '../lib/google';

import type { Env, ReservationInfo } from '../types';

interface UserReservation {
  environment: string;
  service: string;
  since: string;
}

export default async function (env: Env) {
  const reservations: Record<string, UserReservation[]> = {};

  const { keys } = await env.ENVIRONMENT_RESERVATION.list();

  await Promise.all(
    keys.map(async ({ name }) => {
      const [environment, service] = name.split('-');
      const reservation = await env.ENVIRONMENT_RESERVATION.get(name);

      if (reservation) {
        const { id, since } = JSON.parse(reservation) as ReservationInfo;

        if (!reservations[id]) {
          reservations[id] = [];
        }

        reservations[id].push({ environment, since, service });
      }
    }),
  );

  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );

  if (!token) {
    return;
  }

  await Promise.all(
    Object.entries(reservations).map(async ([key, reservations]) => {
      const text = `*🔔 Environment Reservation Reminder*

Hello {user}! This is a friendly reminder that you still have the following environment(s) reserved:

${reservations
  .map(
    ({ environment, since, service }) =>
      `- \`${service}\` in \`${environment}\`, _since ${formatDate(since)}_`,
  )
  .join('\n')}

*⏳ If you are still using the environment(s)*

Feel free to ignore this message.

*✅ If you have finished using the environment(s):*

Please don't forget to unreserve the environment(s) with the \`/unreserve\` command and apply appropriate cleanup procedures such as:

- Reverting migrations
- Restoring environment variables
- Clean temporary files`;

      const response = await fetch(
        `https://chat.googleapis.com/v1/spaces/${env.GOOGLE_SPACE}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.replace('{user}', `<${key}>`),
            privateMessageViewer: {
              name: key,
            },
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json();

        console.error(body);

        throw new Error(
          `Failed to send reminder message to user. Response returned ${response.status}`,
        );
      }
    }),
  );
}
