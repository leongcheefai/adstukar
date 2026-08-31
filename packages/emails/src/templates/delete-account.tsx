interface Props {
  url: string;
}

export function DeleteAccountEmail({ url }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>A request was made to permanently delete your account.</p>
        <p>
          <a href={url}>Confirm account deletion</a>
        </p>
        <p>Link expires in 24 hours. If you did not request this deletion, ignore this email.</p>
      </body>
    </html>
  );
}
