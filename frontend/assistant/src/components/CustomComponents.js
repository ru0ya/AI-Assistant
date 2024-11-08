import React from 'react';


export const Card = ({ children, className }) => (
	<div className={`border rounded shadow p-4 ${className}`}>{children}</div>
);


export const CardHeader = ({ children }) => (
	<div className="border-b pb-2 mb-4">
	   {children}
	</div>
);


export const CardTitle = ({ children }) => (
	<h2 className="text-lg font-semibold">{children}</h2>
);


export const CardContent = ({ children }) => (
	<div className="py-4">{children}</div>
);

export const ScrollArea = ({ children, className = '' }) => (
	<div className={`overflow-y-auto ${className}`}>{children}</div>
);

export const Button = ({ children, onClick, disabled, className }) => (
	<button
	  onClick={onClick}
	  disabled={disabled}
	  className={`px-4 py-2 rounded ${className} ${disabled ? 'opacity-50 cursor-not-allowed': ''}`}
	>
	  {children}
	</button>
);

export const Alert = ({ variant, title, description }) => {
	const alertStyles = variant === 'destructive' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';

	return (
		<div className={`p-4 rounded ${alertStyles}`}>
		  <div className="font-semibold">{title}</div>
		  <p>{description}</p>
		</div>
	);
};

export const AlertTitle = ({ children }) => {
	return (
		<div className="font-medium">{children}</div>
	);
};

export const AlertDescription = ({ children }) => {
	return (
		<div>{children}</div>
	);
};

export const Input = ({type = 'text', onChange, accept, className }) => (
	<input
	  type={type}
	  onChange={onChange}
	  accept={accept}
	  className={`border p-2 rounded ${className}`}
	/>
);
