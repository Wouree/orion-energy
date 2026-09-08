/**
 * nav.js — site navigation.
 *
 * The navigation was a hardcoded list of seven links in `base.njk`. Lots 3 to 6 add roughly twenty pages
 * across four funnels, which that list cannot absorb: it would either overflow the bar or bury the new
 * sections where nobody finds them.
 *
 * So navigation is data. The primary bar carries one entry per audience — you are a household, a
 * business, or someone with a car park — and each entry owns a section listed in the footer. Adding a
 * page means adding a line here, not editing a template.
 *
 * `match` decides the active state: a page is active when its URL starts with any of the given prefixes.
 */

module.exports = {
  primary: [
    { label: 'Accueil', href: '/', match: ['/'], exact: true },
    {
      label: 'Particuliers',
      href: '/services/recharge-domicile/',
      match: ['/services/recharge-domicile/', '/particuliers/', '/comment-ca-marche/', '/reserver/'],
    },
    {
      label: 'Entreprises',
      href: '/services/entreprises/',
      match: ['/services/entreprises/', '/entreprises/', '/flottes/', '/hotellerie-restauration/',
              '/centres-commerciaux/', '/immobilier/', '/stations-service/'],
    },
    {
      label: 'Site partenaire',
      href: '/site-partenaire/',
      match: ['/site-partenaire/'],
    },
    {
      label: 'Réseau',
      href: '/services/bornes-publiques/',
      match: ['/services/bornes-publiques/'],
    },
    {
      label: 'Sécurité',
      href: '/securite/',
      match: ['/securite/', '/technologie/'],
    },
    { label: 'FAQ', href: '/faq/', match: ['/faq/'] },
  ],

  footer: [
    {
      heading: 'Particuliers',
      links: [
        { label: 'Recharge à domicile', href: '/services/recharge-domicile/' },
        { label: 'Comment ça marche', href: '/comment-ca-marche/' },
        { label: 'Réserver une visite', href: '/reserver/' },
        { label: 'FAQ', href: '/faq/' },
      ],
    },
    {
      heading: 'Professionnels',
      links: [
        { label: 'Entreprises', href: '/services/entreprises/' },
        { label: 'Accueillir une borne', href: '/site-partenaire/' },
        { label: 'Critères d’éligibilité', href: '/site-partenaire/criteres/' },
        { label: 'Modèles économiques', href: '/site-partenaire/modeles-economiques/' },
      ],
    },
    {
      heading: 'ORION',
      links: [
        { label: 'À propos', href: '/a-propos/' },
        { label: 'Sécurité & normes', href: '/securite/' },
        { label: 'Bornes publiques', href: '/services/bornes-publiques/' },
        { label: 'Contact', href: '/contact/' },
      ],
    },
  ],
};
