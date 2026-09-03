/** The navigation tree the layout hands down to the shell. */

export interface NavPage {
  route: string;
  navTitle: string;
}

export interface NavGroup {
  name: string;
  pages: NavPage[];
}

export interface NavSection {
  id: string;
  route: string;
  title: string;
  kicker: string;
  groups: NavGroup[];
}
