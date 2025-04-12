export type DeanonymizerRequest = {
  ip: string;
};

export type Contact = {
  guid: string;
  name: string;
  title?: string;
  emailAddresses?: string[];
  phoneNumbers?: string[];
};

export type Company = {
  guid: string;
  name: string;
  domain: string;
};

export type DeanonymizerResponse = {
  ip: string;
  data: {
    company?: Company;
    contact?: Contact;
  };
};
