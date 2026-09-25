function settingField(group, key, label, value, type = 'text') {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  const span = document.createElement('span');
  span.textContent = label;
  const input =
    type === 'textarea'
      ? document.createElement('textarea')
      : type === 'buttonStyle'
        ? document.createElement('select')
        : document.createElement('input');
  if (type === 'buttonStyle') {
    for (const [optionValue, optionLabel] of [
      ['rounded', 'Rounded'],
      ['pill', 'Pill'],
      ['square', 'Square'],
    ]) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionLabel;
      option.selected = optionValue === value;
      input.append(option);
    }
  }
  if (type === 'textarea') input.rows = key === 'customCss' ? 8 : 3;
  else if (type !== 'buttonStyle') input.type = type;
  if (type !== 'buttonStyle') input.value = value || (type === 'color' ? '#000000' : '');
  input.dataset.group = group;
  input.dataset.key = key;
  wrapper.append(span, input);
  return wrapper;
}

export function renderSettings(store, element) {
  const project = store.project;
  element.replaceChildren();
  const form = document.createElement('div');
  form.className = 'grid gap-8 md:grid-cols-2';
  const panels = [
    [
      'Project & SEO',
      [
        ['project', 'name', 'Website name', project.project.name],
        ['seo', 'title', 'Page title', project.seo.title],
        ['seo', 'description', 'Meta description', project.seo.description, 'textarea'],
        ['seo', 'author', 'Author', project.seo.author],
        ['seo', 'canonicalUrl', 'Canonical URL', project.seo.canonicalUrl, 'url'],
        ['seo', 'ogTitle', 'Social preview title', project.seo.ogTitle],
        [
          'seo',
          'ogDescription',
          'Social preview description',
          project.seo.ogDescription,
          'textarea',
        ],
        ['seo', 'ogImage', 'Open Graph image URL', project.seo.ogImage, 'url'],
        ['seo', 'favicon', 'Favicon URL', project.seo.favicon, 'url'],
      ],
    ],
    [
      'Global design',
      [
        ['theme', 'fontFamily', 'Body font family', project.theme.fontFamily],
        ['theme', 'headingFontFamily', 'Heading font family', project.theme.headingFontFamily],
        ['theme', 'primaryColor', 'Primary color', project.theme.primaryColor, 'color'],
        ['theme', 'secondaryColor', 'Secondary color', project.theme.secondaryColor, 'color'],
        ['theme', 'backgroundColor', 'Background color', project.theme.backgroundColor, 'color'],
        ['theme', 'textColor', 'Default text color', project.theme.textColor, 'color'],
        ['theme', 'containerWidth', 'Container width (px)', project.theme.containerWidth, 'number'],
        [
          'theme',
          'borderRadius',
          'Global corner radius (px)',
          project.theme.borderRadius,
          'number',
        ],
        ['theme', 'buttonStyle', 'Default button shape', project.theme.buttonStyle, 'buttonStyle'],
        ['theme', 'spacingScale', 'Spacing scale', project.theme.spacingScale, 'number'],
        ['theme', 'customCss', 'Advanced custom CSS', project.theme.customCss, 'textarea'],
      ],
    ],
  ];
  for (const [title, fields] of panels) {
    const panel = document.createElement('section');
    const heading = document.createElement('h3');
    heading.className = 'mb-4 text-base font-semibold text-white';
    heading.textContent = title;
    panel.append(heading);
    for (const [group, key, label, value, type] of fields)
      panel.append(settingField(group, key, label, value, type));
    form.append(panel);
  }
  form.addEventListener('change', (event) => {
    const input = event.target.closest('[data-group]');
    if (!input) return;
    store.mutate(`Update ${input.dataset.key}`, (document) => {
      document[input.dataset.group][input.dataset.key] = input.value;
      if (input.dataset.group === 'project' && input.dataset.key === 'name')
        document.seo.title ||= input.value;
    });
  });
  element.append(form);
}
