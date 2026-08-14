/**
 * Tipado de referencia para data/servicios.json
 * Fuente de verdad en runtime: servicios.json
 */

export type ServiceIcon =
  | "shield"
  | "chart"
  | "users"
  | "building"
  | "key"
  | "wrench"
  | "report"
  | "scales"
  | "search"
  | "plan"
  | "clock"
  | "star"
  | "check";

export type ServiceQuickBenefit = {
  icon: ServiceIcon;
  title: string;
  text: string;
};

export type ServiceCard = {
  icon: ServiceIcon;
  title: string;
  text: string;
};

export type ServiceStep = {
  icon: ServiceIcon;
  title: string;
  text: string;
};

export type ServiceConfig = {
  id: string;
  nombre: string;
  metaTitle: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    titleHtml: string;
    lead: string;
    image: string;
    imageAlt: string;
    quickBenefits: ServiceQuickBenefit[];
  };
  intro: {
    eyebrow: string;
    titleHtml: string;
    desc: string;
    cards: ServiceCard[];
  };
  proceso: {
    eyebrow: string;
    titleHtml: string;
    steps: ServiceStep[];
  };
  beneficios: {
    eyebrow: string;
    titleHtml: string;
    items: ServiceCard[];
  };
  cta: {
    title: string;
    text: string;
    buttonLabel: string;
    whatsappMessage: string;
  };
};

export type ServicesMap = Record<string, ServiceConfig>;
