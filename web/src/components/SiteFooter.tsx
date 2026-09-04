import { GitHubIcon } from './Icons';
import { Button } from '@/components/ui/button';
import { BUILDER, LICENSE, UPSTREAM } from '@/lib/site';

export default function SiteFooter() {
  return (
    <footer className="bg-background/80 sticky bottom-0 z-30 mt-auto border-t backdrop-blur-md">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-xs lg:px-8">
        <span>
          Primer text © {LICENSE.holder}, licensed under{' '}
          <a
            href={LICENSE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover underline underline-offset-4 transition-colors"
          >
            {LICENSE.name}
          </a>
          .
        </span>
        <span className="hidden sm:inline">
          Source:{' '}
          <a
            href={UPSTREAM}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover underline underline-offset-4 transition-colors"
          >
            system-design-primer
          </a>
        </span>
        <Button variant="ghost" size="xs" asChild className="ml-auto gap-1.5">
          <a
            href={BUILDER}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Built by prawesh-12 on GitHub"
          >
            <span>Built by</span>
            <GitHubIcon />
          </a>
        </Button>
      </div>
    </footer>
  );
}
