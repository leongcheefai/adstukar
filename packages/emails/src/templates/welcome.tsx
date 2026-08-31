import { project } from "@repo/config/project";
import * as React from "react";

interface Props {
  name: string;
}

export function WelcomeEmail({ name }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <p>Hi {name},</p>
        <p>Welcome to {project.name}. Your account is ready — sign in to get started.</p>
        <p>Questions? Reply to this email.</p>
      </body>
    </html>
  );
}
