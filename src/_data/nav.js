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
      href: '/particuliers/',
      match: ['/particuliers/', '/services/recharge-domicile/', '/comment-ca-marche/', '/reserver/', '/guide-puissance/'],
    },
    {
      label: 'Entreprises',
      href: '/entreprises/',
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
    { label: 'Outils', href: '/outils/', match: ['/outils/'] },
    { label: 'FAQ', href: '/faq/', match: ['/faq/'] },
  ],

  footer: [
    {
      heading: 'Particuliers',
      links: [
        { label: 'Recharge à domicile', href: '/particuliers/' },
        { label: 'Avant d’acheter', href: '/particuliers/avant-achat/' },
        { label: 'Tarifs d’installation', href: '/particuliers/tarifs-installation/' },
        { label: 'Quelle puissance choisir', href: '/guide-puissance/' },
        { label: 'Vérificateur de faisabilité', href: '/outils/verificateur-domicile/' },
        { label: 'Réserver une visite', href: '/reserver/' },
        { label: 'FAQ', href: '/faq/' },
      ],
    },
    {
      heading: 'Professionnels',
      links: [
        { label: 'Entreprises', href: '/entreprises/' },
        { label: 'Incitations fiscales', href: '/entreprises/incitations-fiscales/' },
        { label: 'Accueillir une borne', href: '/site-partenaire/' },
        { label: 'Critères d’éligibilité', href: '/site-partenaire/criteres/' },
        { label: 'Modèles économiques', href: '/site-partenaire/modeles-economiques/' },
        { label: 'Calculateur de revenus', href: '/outils/calculateur-revenus-site/' },
        { label: 'Calculateur de flotte', href: '/outils/calculateur-tco-flotte/' },
      ],
    },
    {
      heading: 'ORION',
      links: [
        { label: 'À propos', href: '/a-propos/' },
        { label: 'Sécurité & normes', href: '/securite/' },
        { label: 'Matériel', href: '/technologie/materiel/' },
        { label: 'Solaire et stockage', href: '/technologie/solaire-et-stockage/' },
        { label: 'Bornes publiques', href: '/services/bornes-publiques/' },
        { label: 'Contact', href: '/contact/' },
      ],
    },
  ],
};
