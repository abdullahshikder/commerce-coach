import type { ReactNode } from 'react';

export function EmptyState({title,description,action,icon,compact=false,className=''}: {
  title:string;description:string;action?:ReactNode;icon?:ReactNode;compact?:boolean;className?:string;
}) {
  return <div className={`empty-state${compact?' empty-state-compact':''}${className?` ${className}`:''}`}>
    {icon&&<div className="empty-state-icon" aria-hidden="true">{icon}</div>}
    <div role="status"><h3>{title}</h3><p>{description}</p></div>
    {action&&<div className="empty-state-action">{action}</div>}
  </div>;
}
