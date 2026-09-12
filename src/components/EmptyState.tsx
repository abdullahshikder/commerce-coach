import type { ReactNode } from 'react';

export function EmptyState({title,description,action,compact=false}: {
  title:string;description:string;action?:ReactNode;compact?:boolean;
}) {
  return <div className={`empty-state${compact?' empty-state-compact':''}`}>
    <div role="status"><h3>{title}</h3><p>{description}</p></div>
    {action&&<div className="empty-state-action">{action}</div>}
  </div>;
}
