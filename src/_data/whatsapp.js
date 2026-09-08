/**
 * whatsapp.js — page-aware WhatsApp deep links.
 *
 * Before: three links, two message variants, one of them with no `?text=` at all, none carrying any page
 * context — and all of them pointing at the placeholder number carried in site.json, so every one was dead.
 *
 * After: the number is the confirmed one, and the pre-filled message is composed from where the visitor
 * actually is. Someone writing from the fleet page opens WhatsApp with a fleet message already typed,
 * which is the difference between a conversation that starts with context and one that starts with
 * "Bonjour".
 *
 * Longest prefix wins, so a specific page beats the section it sits in.
 */

const NUMBER = '237692439292';

const SEGMENTS = [
  {
    prefix: '/services/recharge-domicile/',
    segment: 'residentiel',
    text:
      "Bonjour ORION Energy, je souhaite installer une borne de recharge à mon domicile. Pouvez-vous m'indiquer les prochaines étapes ?",
  },
  {
    prefix: '/particuliers/',
    segment: 'residentiel',
    text:
      "Bonjour ORION Energy, je souhaite installer une borne de recharge à mon domicile. Pouvez-vous m'indiquer les prochaines étapes ?",
  },
  {
    prefix: '/reserver/',
    segment: 'residentiel',
    text: "Bonjour ORION Energy, je souhaite réserver une visite d'évaluation à mon domicile.",
  },
  {
    prefix: '/services/entreprises/',
    segment: 'entreprise',
    text:
      "Bonjour ORION Energy, je représente une entreprise et je souhaite étudier l'électrification de notre flotte.",
  },
  {
    prefix: '/entreprises/',
    segment: 'entreprise',
    text:
      "Bonjour ORION Energy, je représente une entreprise et je souhaite étudier l'électrification de notre flotte.",
  },
  {
    prefix: '/flottes/',
    segment: 'entreprise',
    text: "Bonjour ORION Energy, je gère une flotte de véhicules et je souhaite étudier son électrification.",
  },
  {
    prefix: '/site-partenaire/',
    segment: 'site_partenaire',
    text:
      "Bonjour ORION Energy, je dispose d'un site (parking, hôtel, station, centre commercial) et je souhaite étudier l'accueil d'une borne de recharge.",
  },
  {
    prefix: '/services/bornes-publiques/',
    segment: 'site_partenaire',
    text:
      "Bonjour ORION Energy, je souhaite des informations sur votre réseau de bornes publiques.",
  },
  {
    prefix: '/securite/',
    segment: 'support',
    text: "Bonjour ORION Energy, j'ai une question sur la sécurité d'une installation de recharge.",
  },
  {
    prefix: '/technologie/',
    segment: 'support',
    text: "Bonjour ORION Energy, j'ai une question technique sur votre matériel de recharge.",
  },
];

const DEFAULT = {
  segment: 'support',
  text: "Bonjour ORION Energy, je souhaite des informations sur vos services.",
};

function forUrl(url) {
  const match = SEGMENTS.filter((s) => url && url.startsWith(s.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length
  )[0];
  const chosen = match || DEFAULT;
  return {
    number: NUMBER,
    segment: chosen.segment,
    text: chosen.text,
    href: `https://wa.me/${NUMBER}?text=${encodeURIComponent(chosen.text)}`,
  };
}

module.exports = { number: NUMBER, segments: SEGMENTS, default: DEFAULT, forUrl };
