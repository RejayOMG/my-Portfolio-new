// sanity studio schemas — deploy these in your sanity studio project.
// requires sanity-plugin-mux-input for the mux.video type.

export const project = {
  name: 'project',
  title: 'project',
  type: 'document',
  fields: [
    { name: 'title', title: 'title', type: 'string', validation: (r: any) => r.required() },
    {
      name: 'slug',
      title: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r: any) => r.required(),
    },
    { name: 'year', title: 'year', type: 'number' },
    { name: 'shortDescription', title: 'short description', type: 'text', rows: 3 },
    { name: 'client', title: 'client', type: 'string' },
    { name: 'behanceUrl', title: 'behance url', type: 'url' },
    { name: 'thumbnail', title: 'thumbnail', type: 'image', options: { hotspot: true } },
    {
      name: 'styleframes',
      title: 'styleframes',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    },
    { name: 'video', title: 'video', type: 'mux.video' },
  ],
}

export const siteSettings = {
  name: 'siteSettings',
  title: 'site settings',
  type: 'document',
  fields: [
    { name: 'title', title: 'title', type: 'string' },
    { name: 'email', title: 'email', type: 'string' },
    {
      name: 'socialLinks',
      title: 'social links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'label', type: 'string' },
            { name: 'url', title: 'url', type: 'url' },
          ],
        },
      ],
    },
    { name: 'showreel', title: 'showreel', type: 'mux.video' },
  ],
}

export const schemaTypes = [project, siteSettings]
