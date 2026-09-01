type Props = {
  title: string;
  items: { question: string; answer: string }[];
};

/** Раскрывающиеся вопросы. Текст ответов есть в DOM всегда — это важно для краулеров. */
export default function Faq({ title, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section__head">
          <h2>{title}</h2>
        </div>
        <div className="faq-list">
          {items.map((item, index) => (
            <details className="faq-item" key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
