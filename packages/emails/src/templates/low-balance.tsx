import * as React from "react";
interface Props {
  appUrl: string;
}

/**
 * Sent when a member's points run out and every campaign they run stops. The
 * campaigns start again on their own as soon as the purse can pay, so the mail
 * asks for points and nothing else.
 */
export function LowBalanceEmail({ appUrl }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>Your CapyPoints ran out, so your campaigns stopped.</p>
        <p>
          <a href={`${appUrl}/dashboard/campaigns`}>Add points</a> to start them again. They start
          on their own once the points arrive.
        </p>
        <p>If you need help, reply to this email.</p>
      </body>
    </html>
  );
}
