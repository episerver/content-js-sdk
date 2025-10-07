interface CardProps {
  title: string;
  features: string[];
}

function Card({ title, features }: CardProps) {
  return (
    <div className="bg-teal-500 text-white p-6 rounded-lg shadow-lg max-w-sm">
      <h2 className="text-xl font-bold mb-4 uppercase tracking-wide">
        {title}
      </h2>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="text-sm leading-relaxed">
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Card;
