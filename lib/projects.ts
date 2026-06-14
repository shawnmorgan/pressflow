export type ProjectSummary = {
  id: string
  name: string
  target: string
  lastEdited: string
  palette: string[]
  initials: string
}

export const DEMO_PROJECTS: ProjectSummary[] = [
  {
    id: 'aurora',
    name: 'Aurora Press',
    target: 'Ollie · FSE',
    lastEdited: 'Edited 2 hours ago',
    palette: ['#3858e9', '#1d2327', '#f6f7f7', '#dba617', '#2271b1'],
    initials: 'AP',
  },
  {
    id: 'northwind',
    name: 'Northwind Blog',
    target: 'Ollie · FSE',
    lastEdited: 'Edited yesterday',
    palette: ['#0f5132', '#1a1a1a', '#f5f3ee', '#bb8a2e', '#3a7d44'],
    initials: 'NB',
  },
  {
    id: 'studio',
    name: 'Studio Mori',
    target: 'Ollie · FSE',
    lastEdited: 'Edited 4 days ago',
    palette: ['#c0392b', '#231f20', '#faf7f5', '#e08e45', '#7d4a3a'],
    initials: 'SM',
  },
  {
    id: 'harbor',
    name: 'Harbor & Co',
    target: 'Ollie · FSE',
    lastEdited: 'Edited last week',
    palette: ['#13547a', '#0b2027', '#eef4f7', '#80c2d8', '#2e7da0'],
    initials: 'HC',
  },
]
