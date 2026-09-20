import * as React from "react";
interface Props {
  appUrl: string;
}

/**
 * Sent when a member's balance runs out and every campaign they run stops. The
 * campaigns start again on their own as soon as the balance can pay, so the mail
 * asks for a top-up and nothing else.
 */
export function LowBalanceEmail({ appUrl }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>Your balance ran out, so your campaigns stopped.</p>
        <p>
          <a href={`${appUrl}/dashboard/ledger?buy=1`}>Top up</a> to start them again. They start on
          their own once the payment lands.
        </p>
        <p>If you need help, reply to this email.</p>
      </body>
    </html>
  );
}
