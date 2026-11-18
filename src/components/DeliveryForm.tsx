import { ZONES, money } from '../config';
import { formatPhone, normalizePhone, type Delivery, type FieldError } from '../lib/order';
import { Phone, Pin } from './Icons';

interface Props {
  value: Delivery;
  onChange: (patch: Partial<Delivery>) => void;
  errors: FieldError;
  showErrors: boolean;
  /** id prefix so two forms can live on one page; fields get `${idp}-zone|area|phone|name` */
  idp?: string;
  title?: string;
}

/** Delivery area + location + rider contact: the same form for the Combo and the shop bag. */
export function DeliveryForm({ value, onChange, errors, showErrors, idp = 'f', title = 'Where should we deliver?' }: Props) {
  const err = (k: keyof FieldError) => (showErrors ? errors[k] : undefined);
  const id = (k: string) => `${idp}-${k}`;

  return (
    <>
      <fieldset className="zone-set" id={id('zone')} tabIndex={-1} aria-describedby={err('zone') ? id('e-zone') : undefined}>
        <legend className="b-q">{title}</legend>
        <div className="zone-list" role="radiogroup">
          {ZONES.map((z) => (
            <button
              type="button"
              role="radio"
              key={z.id}
              className={`zone ${value.zone === z.id ? 'is-on' : ''}`}
              aria-checked={value.zone === z.id}
              onClick={() => onChange({ zone: z.id })}
            >
              <span className="zone-radio" aria-hidden="true" />
              <span className="zone-main">
                <span className="zone-lbl">{z.label}</span>
                <span className="zone-areas">{z.areas}</span>
              </span>
              <span className="zone-fee">{z.fee !== null ? money(z.fee) : 'Fee on WhatsApp'}</span>
            </button>
          ))}
        </div>
        {err('zone') && (
          <p className="field-err" id={id('e-zone')}>
            {err('zone')}
          </p>
        )}
      </fieldset>

      <label className={`field ${err('area') ? 'has-err' : ''}`}>
        <span className="field-lbl">
          <Pin size={14} /> {value.zone === 'elsewhere' ? 'Town & nearest landmark' : 'Area & nearest landmark'}
          <span className="req">Required</span>
        </span>
        <input
          id={id('area')}
          type="text"
          autoComplete="street-address"
          enterKeyHint="next"
          placeholder={
            value.zone === 'elsewhere'
              ? 'e.g. Kumasi, Adum near Kejetia'
              : value.zone === 'kasoa'
                ? 'e.g. Kasoa, near Tollbooth'
                : 'e.g. Madina, near Zongo Junction'
          }
          value={value.area}
          aria-invalid={!!err('area')}
          aria-describedby={err('area') ? id('e-area') : undefined}
          onChange={(e) => onChange({ area: e.target.value })}
        />
        {err('area') && (
          <span className="field-err" id={id('e-area')}>
            {err('area')}
          </span>
        )}
      </label>

      <label className={`field ${err('phone') ? 'has-err' : ''}`}>
        <span className="field-lbl">
          <Phone size={14} /> Contact number for the rider
          <span className="req">Required</span>
        </span>
        <input
          id={id('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          placeholder="e.g. 024 123 4567"
          value={value.phone}
          aria-invalid={!!err('phone')}
          aria-describedby={err('phone') ? id('e-phone') : undefined}
          onChange={(e) => onChange({ phone: e.target.value })}
          onBlur={() => {
            const n = normalizePhone(value.phone);
            if (n) onChange({ phone: formatPhone(n) });
          }}
        />
        {err('phone') && (
          <span className="field-err" id={id('e-phone')}>
            {err('phone')}
          </span>
        )}
      </label>

      <label className="field">
        <span className="field-lbl">Your name</span>
        <input
          id={id('name')}
          type="text"
          autoComplete="name"
          enterKeyHint="done"
          placeholder="e.g. Ama Mensah"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>
    </>
  );
}

/** Scrolls to and focuses the first invalid delivery field. */
export function focusFirstError(errors: FieldError, idp = 'f') {
  const first = (['zone', 'area', 'phone'] as const).find((k) => errors[k]);
  if (!first) return;
  const el = document.getElementById(`${idp}-${first}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (el instanceof HTMLInputElement) window.setTimeout(() => el.focus({ preventScroll: true }), 350);
}
