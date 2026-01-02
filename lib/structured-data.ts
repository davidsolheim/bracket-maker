const DOMAIN = 'https://www.bracket-magic.com';

export function getWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Bracket Magic',
    'description': 'A modern tournament bracket management application for creating and managing professional tournament brackets.',
    'url': DOMAIN,
    'applicationCategory': 'SportsApplication',
    'operatingSystem': 'Web Browser',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'author': {
      '@type': 'Person',
      'name': 'David Solheim',
      'url': 'https://davidsolheim.com',
    },
  };
}

export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Bracket Magic',
    'description': 'Tournament bracket manager supporting double elimination, round robin, Swiss system, and more.',
    'applicationCategory': 'UtilitiesApplication',
    'operatingSystem': 'Any',
    'offers': {
      '@type': 'Offer',
      'price': '0',
    },
  };
}

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Bracket Magic',
    'url': DOMAIN,
    'logo': `${DOMAIN}/bracket-magic-icon.png`,
    'sameAs': [
      'https://github.com/davidsolheim/bracket-maker',
    ],
  };
}

export function getBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': `${DOMAIN}${item.item}`,
    })),
  };
}
