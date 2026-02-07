import { Environments } from '../const';
import { getGoogleAuthToken } from '../lib/google';

import type { Env } from '../types';

interface ReservationInfo {
  email: string;
  since: string; // ISO string
  channel: string;
}

interface UserReservation {
  environment: string;
  since: string;
  channel: string;
}

export default async function (env: Env) {
  const reservations: Record<string, UserReservation[]> = {};

  await Promise.all(
    Environments.map(async (environment) => {
      const reservation = await env.ENVIRONMENT_RESERVATION.get(environment);

      if (reservation) {
        const { email, since, channel } = JSON.parse(
          reservation,
        ) as ReservationInfo;

        if (!reservations[email]) {
          reservations[email] = [];
        }

        reservations[email].push({ environment, since, channel });
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
    ({ environment, since }, idx) =>
      `${idx + 1}. \`${environment}\`, _since ${new Date(
        since,
      ).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}_`,
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
        `https://chat.googleapis.com/v1/${reservations[0].channel}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.replace('{user}', `<users/${key}>`),
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
