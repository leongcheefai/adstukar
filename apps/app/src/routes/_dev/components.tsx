import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@repo/ui";

export default function DevComponentsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold">Component showcase</h1>
          <p className="mt-1 text-muted-foreground">Dev-only. Not included in production builds.</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Button</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Badge</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Input + Label</h2>
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="demo-input">Email address</Label>
            <Input id="demo-input" type="email" placeholder="you@example.com" />
          </div>
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="demo-disabled">Disabled</Label>
            <Input id="demo-disabled" disabled value="cannot edit" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Card</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Supporting description text.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card body content goes here.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>With action</CardTitle>
                <CardDescription>Card with a button.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm">Action</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
