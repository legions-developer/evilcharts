"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DEFAULT_PROVIDER,
  PROVIDERS,
  PROVIDER_META,
  providerFromPathname,
  providerHref,
  type Provider,
} from "@/globals/constants/providers";
import { CheckIcon, EChartsIcon, ReactIcon } from "@/assets/icons";
import { CaretDown } from "@carbon/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Each engine wears its own mark: Recharts renders through React, so it gets the
// React logo; ECharts gets Apache's. Both inherit currentColor, matching every
// other icon in the sidebar.
const PROVIDER_ICONS: Record<Provider, React.ComponentType<{ className?: string }>> = {
  recharts: ReactIcon,
  echarts: EChartsIcon,
};

function ProviderIcon({ provider, className }: { provider: Provider; className?: string }) {
  const Icon = PROVIDER_ICONS[provider];

  return <Icon className={className} aria-hidden="true" />;
}

export function ProviderSwitcher({ existingUrls }: { existingUrls: Set<string> }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const activeProvider = providerFromPathname(pathname);
  // Shared pages (/docs, /docs/chart-config) have no provider. Show the default's
  // name so the trigger never renders empty, but leave every item unchecked —
  // nothing is actually selected.
  const displayed = PROVIDER_META[activeProvider ?? DEFAULT_PROVIDER];

  const selectProvider = (provider: Provider) => {
    if (isMobile) {
      setOpenMobile(false);
    }

    // Hold your place across the switch when the counterpart page exists:
    // /docs/recharts/area-chart/static → /docs/echarts/area-chart/static.
    // Otherwise the provider index is the only destination we can promise.
    if (activeProvider) {
      const candidate = pathname.replace(`/docs/${activeProvider}`, `/docs/${provider}`);

      if (existingUrls.has(candidate)) {
        router.push(candidate);
        return;
      }
    }

    router.push(providerHref(provider));
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={cn(
                  "data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground",
                  "border-border/60 border",
                )}
              />
            }
          >
            <ProviderIcon provider={displayed.id} className="size-5!" />
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">{displayed.name}</span>
              <span className="text-muted-foreground truncate text-[11px]">
                {displayed.tagline}
              </span>
            </div>
            <CaretDown className="ml-auto opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="w-(--anchor-width)"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Rendering engine
              </DropdownMenuLabel>
              {PROVIDERS.map((id) => {
                const meta = PROVIDER_META[id];
                const isActive = activeProvider === id;

                return (
                  <DropdownMenuItem
                    key={id}
                    onClick={() => selectProvider(id)}
                    className="gap-2 p-2"
                  >
                    <ProviderIcon provider={id} className="size-5!" />
                    <div className="grid flex-1 leading-tight">
                      <span className="flex items-center gap-1.5 text-sm">
                        {meta.name}
                        {!meta.available && (
                          <span className="border-border text-muted-foreground rounded-sm border px-1 py-px text-[9px] tracking-wide uppercase">
                            Soon
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-[11px]">{meta.tagline}</span>
                    </div>
                    {isActive && <CheckIcon className="size-3.5" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
