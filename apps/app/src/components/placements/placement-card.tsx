import { ArrowsClockwise, Trash, X } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { PlacementSize, PlacementWithTerms, Product } from "@repo/contracts/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useDeletePlacement,
  useRotateKey,
  useSetExcludedTerms,
  useUpdatePlacement,
} from "../../lib/placements";
import { CopyButton } from "../copy-button";
import { htmlSnippet, reactSnippet } from "./snippet";

const SIZE_LABEL: Record<PlacementSize, string> = {
  small: `Small banner · ${economy.cardSizes.small.width}×${economy.cardSizes.small.height}`,
  medium: `Medium card · ${economy.cardSizes.medium.width}×${economy.cardSizes.medium.height}`,
};

export function PlacementCard({ item, product }: { item: PlacementWithTerms; product: Product }) {
  const { placement, excludedTerms } = item;
  const update = useUpdatePlacement();
  const rotate = useRotateKey();
  const setTerms = useSetExcludedTerms();
  const remove = useDeletePlacement();

  const [housePct, setHousePct] = useState(placement.houseAdPct);
  const [term, setTerm] = useState("");
  useEffect(() => setHousePct(placement.houseAdPct), [placement.houseAdPct]);

  const onError = (err: Error) => toast.error(err.message);

  function addTerm() {
    const phrase = term.trim().toLowerCase();
    if (!phrase) return;
    if (excludedTerms.includes(phrase)) {
      setTerm("");
      return;
    }
    if (excludedTerms.length >= economy.excludedTerms.max) {
      toast.error(`You can exclude up to ${economy.excludedTerms.max} terms.`);
      return;
    }
    setTerms.mutate(
      { id: placement.id, phrases: [...excludedTerms, phrase] },
      { onSuccess: () => setTerm(""), onError },
    );
  }

  function removeTerm(phrase: string) {
    setTerms.mutate(
      { id: placement.id, phrases: excludedTerms.filter((t) => t !== phrase) },
      { onError },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{product.name}</CardTitle>
            <CardDescription>
              Placement on <span className="font-mono">{product.domain}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!product.verifiedAt && (
              <Badge variant="warning">Domain not verified — serves nothing</Badge>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this placement?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The API key stops working immediately. Snippets using it render nothing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      remove.mutate(placement.id, {
                        onSuccess: () => toast.success("Placement deleted"),
                        onError,
                      })
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label>API key</Label>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5 font-mono text-xs">
              {placement.apiKey}
            </code>
            <CopyButton value={placement.apiKey} size="icon" label="Copy API key" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="outline" aria-label="Rotate API key">
                  <ArrowsClockwise size={14} className={rotate.isPending ? "animate-spin" : ""} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rotate the API key?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The old key stops working at once. Update every snippet that uses it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      rotate.mutate(placement.id, {
                        onSuccess: () => toast.success("API key rotated"),
                        onError,
                      })
                    }
                  >
                    Rotate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Embed snippet</Label>
          <Tabs defaultValue="html">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="space-y-2">
              <pre className="overflow-x-auto rounded-md border bg-muted p-3 font-mono text-xs">
                {htmlSnippet(placement.apiKey)}
              </pre>
              <CopyButton value={htmlSnippet(placement.apiKey)} label="Copy snippet" />
            </TabsContent>
            <TabsContent value="react" className="space-y-2">
              <pre className="overflow-x-auto rounded-md border bg-muted p-3 font-mono text-xs">
                {reactSnippet(placement.apiKey)}
              </pre>
              <CopyButton value={reactSnippet(placement.apiKey)} label="Copy component" />
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Size</Label>
            <Select
              value={placement.size}
              onValueChange={(v) =>
                update.mutate(
                  { id: placement.id, input: { size: v as PlacementSize } },
                  { onError },
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SIZE_LABEL) as PlacementSize[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SIZE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>House ad share</Label>
              <span className="font-mono text-xs text-muted-foreground">{housePct}%</span>
            </div>
            <Slider
              value={[housePct]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => setHousePct(v ?? 0)}
              onValueCommit={([v]) =>
                update.mutate(
                  { id: placement.id, input: { houseAdPct: v ?? 0 } },
                  { onError, onSuccess: () => toast.success("House ad share saved") },
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              Share of impressions that show your own product instead. Earns nothing, costs nothing.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`term-${placement.id}`}>Excluded terms</Label>
          <div className="flex gap-2">
            <Input
              id={`term-${placement.id}`}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTerm();
                }
              }}
              maxLength={economy.excludedTerms.maxLength}
              placeholder="e.g. crypto"
            />
            <Button type="button" variant="outline" onClick={addTerm} disabled={setTerms.isPending}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {excludedTerms.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ads whose name or tagline contains a term are never shown here. Up to{" "}
                {economy.excludedTerms.max}.
              </p>
            )}
            {excludedTerms.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1 pr-1">
                {t}
                <button
                  type="button"
                  onClick={() => removeTerm(t)}
                  aria-label={`Remove ${t}`}
                  className="rounded-sm hover:bg-foreground/10"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
