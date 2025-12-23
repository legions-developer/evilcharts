import { IconProps } from "@/types/svg";

export function AddMagicIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="m14,9.25c0-.3076-.1885-.5845-.4746-.6973l-3.8184-1.5103-1.5098-3.8184c-.1133-.2861-.3896-.4741-.6973-.4741s-.584.188-.6973.4741l-1.5107,3.8184-3.8174,1.5103c-.2861.1128-.4746.3896-.4746.6973s.1885.5845.4746.6973l3.8174,1.5103,1.5107,3.8184c.1133.2861.3896.4741.6973.4741s.584-.188.6973-.4741l1.5098-3.8184,3.8184-1.5103c.2861-.1128.4746-.3896.4746-.6973Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m16,13.5h-1v-1c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v1h-1c-.4141,0-.75.3359-.75.75s.3359.75.75.75h1v1c0,.4141.3359.75.75.75s.75-.3359.75-.75v-1h1c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <circle cx="14" cy="4" fill={fill} r="2.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export function ChartStackedAreaIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M17 3.70299C17 2.69702 15.8709 2.10066 15.0402 2.67357L8.99926 6.83961L5.76729 4.61823C5.27016 4.27631 4.60011 4.33822 4.17467 4.76366L1.36567 7.57266L1.36284 7.5755C1.13264 7.80818 1 8.12404 1 8.45699V12.25C1 13.7692 2.23079 15 3.75 15H14.25C15.7692 15 17 13.7692 17 12.25V3.70299Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
        <path
          d="M17 8.96125C16.9878 8.7256 16.8652 8.50845 16.6678 8.37648C16.4596 8.23731 16.1957 8.21123 15.9643 8.30698L9.10897 11.1435L5.739 8.616L5.73733 8.61475C5.30873 8.29516 4.72063 8.28052 4.27601 8.58911L1.3231 10.6334C1.12075 10.7734 1 11.0039 1 11.25V12.25C1 13.7692 2.23079 15 3.75 15H14.25C15.7692 15 17 13.7692 17 12.25V8.96125Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export function ChartStackedLineIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M16.4033 2.11827C16.7522 2.34154 16.854 2.80536 16.6307 3.15425L12.9307 8.93625C12.5316 9.55989 11.6784 9.70427 11.097 9.23827V9.23827L7.26314 6.1706L5.84311 9.08181C5.66151 9.45409 5.2125 9.60868 4.84022 9.42708C4.46793 9.24549 4.31335 8.79648 4.49494 8.4242L6.0515 5.23311V5.23311C6.403 4.51103 7.333 4.30551 7.95654 4.80435L11.8172 7.89346L15.3673 2.34575C15.5905 1.99685 16.0544 1.89501 16.4033 2.11827Z"
          fill={secondaryfill}
          fillOpacity="0.4"
          fillRule="evenodd"
        />
        <path
          d="M4.03587 11.0759C4.40816 11.2575 4.56276 11.7065 4.38118 12.0788L2.67408 15.5788C2.4925 15.9511 2.04349 16.1057 1.6712 15.9241C1.29891 15.7425 1.14431 15.2935 1.32589 14.9212L3.03299 11.4212C3.21458 11.0489 3.66358 10.8943 4.03587 11.0759Z"
          fill={secondaryfill}
          fillOpacity="0.4"
          fillRule="evenodd"
        />
        <path
          d="M1.25 8.75C1.25 8.33579 1.58579 8 2 8H5.171C5.35637 8 5.53517 8.06865 5.67291 8.1927L11.0293 13.0167L15.5314 9.41439C15.8549 9.1556 16.3268 9.20801 16.5856 9.53143C16.8444 9.85486 16.792 10.3268 16.4686 10.5856L11.8009 14.3204C11.3228 14.7034 10.6377 14.6829 10.1829 14.2732L4.88305 9.5H2C1.58579 9.5 1.25 9.16421 1.25 8.75ZM10.8634 13.1494C10.8634 13.1494 10.8635 13.1494 10.8635 13.1493L10.8634 13.1494ZM11.1867 13.1585C11.1868 13.1586 11.1869 13.1587 11.1871 13.1588L11.1869 13.1587L11.1867 13.1585Z"
          fill={fill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export function ShapesIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M9.5 6C9.5 3.79079 11.2908 2 13.5 2C15.7092 2 17.5 3.79079 17.5 6C17.5 8.20921 15.7092 10 13.5 10C11.2908 10 9.5 8.20921 9.5 6Z"
          fill={secondaryfill}
          fillOpacity="0.2"
          fillRule="evenodd"
        />
        <path
          d="M4 11.75C4 10.7838 4.78379 10 5.75 10H9.25C10.2162 10 11 10.7838 11 11.75V15.25C11 16.2162 10.2162 17 9.25 17H5.75C4.78379 17 4 16.2162 4 15.25V11.75Z"
          fill={secondaryfill}
          fillOpacity="0.4"
          fillRule="evenodd"
        />
        <path
          d="M3.17008 1.61218C3.65248 0.784937 4.84752 0.784954 5.32988 1.61223L7.95885 6.12018C8.44348 6.95204 7.84493 8.00002 6.87897 8.00002H1.62097C0.65499 8.00002 0.056293 6.95232 0.540926 6.12046L3.17008 1.61218Z"
          fill={fill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export function HouseIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="M15.999 7.75C15.843 7.75 15.685 7.701 15.55 7.6L9.00001 2.688L2.45001 7.6C2.11901 7.85 1.64701 7.781 1.40001 7.45C1.15101 7.118 1.21801 6.648 1.54901 6.4L8.55001 1.15C8.81801 0.95 9.18301 0.95 9.45001 1.15L16.45 6.4C16.781 6.649 16.848 7.119 16.599 7.45C16.453 7.646 16.228 7.75 15.999 7.75Z"
          fill={fill}
        />
        <path
          d="M14.649 8.80001L9 4.56201L3.351 8.80001C3.24 8.88301 3.122 8.95201 3 9.01301V14.25C3 15.767 4.233 17 5.75 17H8.25V13.25C8.25 12.836 8.586 12.5 9 12.5C9.414 12.5 9.75 12.836 9.75 13.25V17H12.25C13.767 17 15 15.767 15 14.25V9.01301C14.878 8.95201 14.76 8.88301 14.649 8.80001Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
      </g>
    </svg>
  );
}

export function HistoryIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="m9,4c-.414,0-.75.336-.75.75v4.25c0,.246.121.477.323.617l3.25,2.25c.13.09.279.133.426.133.238,0,.472-.113.617-.323.236-.34.151-.808-.19-1.043l-2.927-2.026v-3.857c0-.414-.336-.75-.75-.75l.001-.001Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m9,1c-2.486,0-4.7678,1.1514-6.2614,3.0374l-.1155-.8352c-.0576-.4102-.4443-.6973-.8457-.6396-.4111.0566-.6973.4355-.6406.8457l.4082,2.9448c.0527.3755.374.647.7422.647.0342,0,.0684-.0024.1035-.0068l2.9443-.4067c.4102-.0571.6973-.4355.6406-.8457s-.4287-.6895-.8457-.6406l-1.4572.2012c1.199-1.7278,3.1668-2.8013,5.3273-2.8013,3.584,0,6.5,2.916,6.5,6.5s-2.916,6.5-6.5,6.5c-3.5469,0-6.4014-2.7754-6.4971-6.3184-.0117-.4141-.3467-.7461-.7705-.729-.4141.0112-.7402.356-.7295.77.1191,4.3608,3.6318,7.7773,7.9971,7.7773,4.4111,0,8-3.5889,8-8S13.4111,1,9,1Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export function SquareAddon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={fill}>
        <path
          d="m6.75,2h-2c-1.5166,0-2.75,1.2334-2.75,2.75v1.5c0,.4141.3359.75.75.75s.75-.3359.75-.75v-1.5c0-.6895.5605-1.25,1.25-1.25h2c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m15.25,11c-.4141,0-.75.3359-.75.75v1.5c0,.6895-.5605,1.25-1.25,1.25h-2c-.4141,0-.75.3359-.75.75s.3359.75.75.75h2c1.5166,0,2.75-1.2334,2.75-2.75v-1.5c0-.4141-.3359-.75-.75-.75Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m6.75,14.5h-2c-.6895,0-1.25-.5605-1.25-1.25v-1.5c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v1.5c0,1.5166,1.2334,2.75,2.75,2.75h2c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m16.5,3.5h-2V1.5c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v2h-2c-.4141,0-.75.3359-.75.75s.3359.75.75.75h2v2c0,.4141.3359.75.75.75s.75-.3359.75-.75v-2h2c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}
