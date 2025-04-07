export interface Gig {
    client: string;
    id: string;
    title: string;
    description: string;
    category: 'Content Creation' | 'Design' | 'Development';
    status: 'open' | 'in_review' | 'completed';
    payout: number;
    deadline: string;
    skills: string[];
  }
  
  