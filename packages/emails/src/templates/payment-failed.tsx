interface Props {
  appUrl: string;
}

export function PaymentFailedEmail({ appUrl }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>Your recent payment failed.</p>
        <p>
          <a href={`${appUrl}/billing`}>Update your billing details</a> to keep your subscription
          active.
        </p>
        <p>If you need help, reply to this email.</p>
      </body>
    </html>
  );
}
