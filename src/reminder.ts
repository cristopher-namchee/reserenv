import { Environments } from './params';
import type { Env } from './types';

interface ReservationInfo {
  id: string;
  since: string; // ISO string
}

interface UserReservation {
  environment: string;
  since: string;
}

function createHeaderCell(text: string): unknown {
  return {
    type: 'rich_text',
    elements: [
      {
        type: 'rich_text_section',
        elements: [{ type: 'text', text, style: { bold: true } }],
      },
    ],
  };
}

function createCodeCell(text: string): unknown {
  return {
    type: 'rich_text',
    elements: [
      {
        type: 'rich_text_section',
        elements: [{ type: 'text', text, style: { code: true } }],
      },
    ],
  };
}

function createTextCell(text: string): unknown {
  return {
    type: 'rich_text',
    elements: [
      {
        type: 'rich_text_section',
        elements: [{ type: 'text', text }],
      },
    ],
  };
}

function createTableRows(reservations: UserReservation[]): unknown[] {
  const rows: unknown[] = [
    [createHeaderCell('Environment'), createHeaderCell('Reserved Since')],
  ];

  for (const { environment, since } of reservations) {
    rows.push([
      createCodeCell(environment),
      createTextCell(
        new Date(since).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      ),
    ]);
  }

  return rows;
}

function createReminderSections(): unknown[] {
  return [
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⏳ *If you are still using the environment(s):*',
      },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: 'Feel free to ignore this message.' },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✔️ *If you have finished using the environment(s):*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "Please don't forget to unreserve the environment(s) with the `/unreserve` command and apply appropriate cleanup procedures such as:",
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_list',
          style: 'bullet',
          indent: 0,
          elements: [
            {
              type: 'rich_text_section',
              elements: [{ type: 'text', text: 'Reverting migrations' }],
            },
            {
              type: 'rich_text_section',
              elements: [
                { type: 'text', text: 'Restoring environment variables' },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [{ type: 'text', text: 'Clean temporary files' }],
            },
          ],
        },
      ],
    },
  ];
}

export function createMessageBlocks(
  reservations: UserReservation[],
): unknown[] {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 Environment Reservation Reminder',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Hello! This is a friendly reminder that you still have the following environment(s) reserved:',
      },
    },
    { type: 'table', rows: createTableRows(reservations) },
    ...createReminderSections(),
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Thank you for using Reserenv!',
      },
    },
  ];
}

export default async function (env: Env) {
  const reservations: Record<string, UserReservation[]> = {};

  await Promise.all(
    Environments.map(async (environment) => {
      const reservation = await env.ENVIRONMENT_RESERVATION.get(environment);

      if (reservation) {
        const { id, since } = JSON.parse(reservation) as ReservationInfo;

        if (!reservations[id]) {
          reservations[id] = [];
        }

        reservations[id].push({ environment, since });
      }
    }),
  );

  await Promise.all(
    Object.entries(reservations).map(async ([key, reservations]) => {
      const blocks = createMessageBlocks(reservations);

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: key,
          blocks,
        }),
      });
    }),
  );
}
