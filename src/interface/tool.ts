export interface Commonreq {
  [key: string]: unknown;
}

export interface Commorsp {
  [key: string]: unknown;
}

export interface GetComponentRsp {
  success: boolean;
  data?: {
    component_name: string;
    description: string;
    path: string;
    props: {
      name: string;
      type: string;
      default?: string;
      description?: string;
    }[],
    events: {
      name: string;
      description?: string;
    }[],
    code?: string;
    timestamp: string;
  }
}

export interface GetComponentArgs {
  component_name: string;
}

export function isValidGetComponentArgs(args: unknown): args is GetComponentArgs {
  
  if (typeof args !== 'object' || args === null) {
    return false;
  }

  const { component_name } = args as GetComponentArgs;

  if (typeof component_name !== 'string' || component_name.trim() === '') {
    return false;
  }

  return true;
}
