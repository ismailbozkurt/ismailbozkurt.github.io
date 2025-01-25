interface ContentItem {
  name: string;
  path: string;
}

interface ContentSection {
  title: string;
  items: ContentItem[];
}

interface SiteContent {
  sections: ContentSection[];
}

export const siteContent: SiteContent = {
  sections: [
    {
      title: "INTRO",
      items: [
        {
          name: "About Me",
          path: "/Content/Intro/About-me.md"
        }
      ]
    },
    {
      title: "CODE PIECES",
      items: [
        {
          name: "Sample",
          path: "/Content/Code Pieces/sample.md"
        }
      ]
    },
    {
      title: "PROJECTS",
      items: [
        {
          name: "Project 1",
          path: "/Content/Projects/project1.md"
        }
      ]
    },
    {
      title: "VULNERABILITY RESEARCH",
      items: [
        {
          name: "Research 1",
          path: "/Content/Vulnerability Research/research1.md"
        },
        {
          name: "Research Methodology",
          path: "/Content/Vulnerability Research/deneme.md"
        }
      ]
    }
  ]
}; 
