import { Environments } from './params';
import type { Env } from './types';

interface ReservationInfo {
  id: string;
  since: string; // ISO string
}

interface UserReservations {
  environment: string;
  since: string;
}

export default async function (env: Env) {
  const reservations: Record<string, UserReservations[]> = {
    U05AH0GJ6DD: [
      {
        environment: 'dev1',
        since: new Date().toISOString(),
      },
    ],
  };

  // await Promise.all(
  //   Environments.map(async (environment) => {
  //     const reservation = await env.ENVIRONMENT_RESERVATION.get(environment);

  //     if (reservation) {
  //       const { id, since } = JSON.parse(reservation) as ReservationInfo;

  //       if (!reservations[id]) {
  //         reservations[id] = [];
  //       }

  //       reservations[id].push({ environment, since });
  //     }
  //   }),
  // );

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 Environment Reservation Reminder',
        emoji: true,
      },
    },
    {
      type: '',
    },
  ];

  await Promise.all(
    Object.entries(reservations).map(async ([key, value]) => {
      const text = `
Hello! This is a reminder message that you've been reserving:

${value
  .map(
    (val) =>
      `• \`${val.environment}\` since ${new Date(val.since).toLocaleDateString(
        'en-GB',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )}`,
  )
  .join('\n')}

*If you're still using the environment(s)*:

Feel free to ignore this message.

*If you have finished using the environment(s)*:

Please don't forget to unreserve the environment(s) with \`/unreserve\` command and apply appropriate cleanup to the environment (e.g: reverting migrations, restoring environment variables, etc).

Thank you!
`;
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: key,
          mrkdwn: true,
          text,
        }),
      });
    }),
  );
}
