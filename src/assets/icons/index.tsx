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
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
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
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
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
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
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

export function BarChartIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="m6.75,9h-3.5c-.9648,0-1.75.7852-1.75,1.75v3c0,.9648.7852,1.75,1.75,1.75h3.5c.4141,0,.75-.3359.75-.75v-5c0-.4141-.3359-.75-.75-.75Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m14.75,5.5h-3.5c-.4141,0-.75.3359-.75.75v8.5c0,.4141.3359.75.75.75h3.5c.9648,0,1.75-.7852,1.75-1.75v-6.5c0-.9648-.7852-1.75-1.75-1.75Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m10.25,2h-2.5c-.9648,0-1.75.7852-1.75,1.75v11c0,.4141.3359.75.75.75h4.5c.4141,0,.75-.3359.75-.75V3.75c0-.9648-.7852-1.75-1.75-1.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export function ComposedChartIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        {/* Bar chart bars - narrower */}
        <rect x="2.5" y="9" width="4" height="6.5" rx="1.5" fill={secondaryfill} opacity="0.4" />
        <rect x="7.5" y="4" width="4" height="11.5" rx="1.5" fill={secondaryfill} opacity="0.4" />
        <rect x="12.5" y="6" width="4" height="9.5" rx="1.5" fill={secondaryfill} opacity="0.4" />
        {/* Line chart line overlay */}
        <path
          d="M2 10.5 L5 13.5L9 8.5L13 10.5L17 7.5"
          fill="none"
          stroke={fill}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function PieChartIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M13.4379 15.6572L9.1558 9.4247C9.06992 9.29971 9.02396 9.15163 9.02396 8.99999V1.00003C13.4311 1.01295 17 4.58966 17 9C17 11.7765 15.5855 14.2227 13.4379 15.6572Z"
          fill={secondaryfill}
          fillOpacity="0.2"
        />
        <path
          d="M9.02396 8.95013L14.9714 3.67613C16.2331 5.09034 17 6.95561 17 9C17 11.7765 15.5855 14.2227 13.4379 15.6572L9.1558 9.4247C9.06992 9.29971 9.02396 9.15163 9.02396 8.99999V8.95013Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
        <path
          d="M1 9C1 4.58168 4.58179 1 9 1L9.02396 1.00003V8.99997C9.02396 9.15161 9.06993 9.2997 9.1558 9.42468L13.4379 15.6572C12.168 16.5055 10.6417 17 9 17C4.58179 17 1 13.4183 1 9Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export function RadialChartIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        {/* Outer arc */}
        <path
          d="M9 1C13.4183 1 17 4.58172 17 9C17 13.4183 13.4183 17 9 17C4.58172 17 1 13.4183 1 9C1 4.58172 4.58172 1 9 1ZM9 3C5.68629 3 3 5.68629 3 9C3 12.3137 5.68629 15 9 15C12.3137 15 15 12.3137 15 9C15 5.68629 12.3137 3 9 3Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
        {/* Middle arc */}
        <path
          d="M9 4C11.7614 4 14 6.23858 14 9C14 11.7614 11.7614 14 9 14C6.23858 14 4 11.7614 4 9C4 6.23858 6.23858 4 9 4ZM9 5.5C7.067 5.5 5.5 7.067 5.5 9C5.5 10.933 7.067 12.5 9 12.5C10.933 12.5 12.5 10.933 12.5 9C12.5 7.067 10.933 5.5 9 5.5Z"
          fill={fill}
        />
        {/* Inner arc */}
        <path
          d="M9 6.5C10.3807 6.5 11.5 7.61929 11.5 9C11.5 10.3807 10.3807 11.5 9 11.5C7.61929 11.5 6.5 10.3807 6.5 9C6.5 7.61929 7.61929 6.5 9 6.5ZM9 7.5C8.17157 7.5 7.5 8.17157 7.5 9C7.5 9.82843 8.17157 10.5 9 10.5C9.82843 10.5 10.5 9.82843 10.5 9C10.5 8.17157 9.82843 7.5 9 7.5Z"
          fill={secondaryfill}
          fillOpacity="0.5"
        />
      </g>
    </svg>
  );
}

export function RadarChartIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M10.5578 1.54834C9.64717 0.816721 8.35366 0.817187 7.44267 1.54798L2.43452 5.5691C1.67356 6.17993 1.33892 7.17832 1.57413 8.12487L3.06421 14.1062C3.34102 15.2176 4.33677 16 5.48198 16H12.518C13.6632 16 14.659 15.2177 14.9358 14.1062L16.4258 8.1253C16.6611 7.17961 16.3265 6.18003 15.5656 5.56918L10.5578 1.54834Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
        <path
          d="M8.63229 5.09632C8.88243 4.95562 9.19093 4.97 9.4269 5.13336L12.6769 7.38336C12.9601 7.57943 13.0734 7.94322 12.9515 8.26539L11.7185 11.5244C11.6298 11.7587 11.4301 11.9333 11.186 11.9897L6.90202 12.9807C6.54336 13.0637 6.17751 12.8741 6.03851 12.5332L4.30551 8.28319C4.16278 7.93317 4.30284 7.53164 4.63229 7.34632L8.63229 5.09632Z"
          fill={fill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export function SankeyChartIcon({
  fill = "currentColor",
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17 1H1V9H4.49217C5.11298 9.00084 6.23676 8.97225 6.79234 9.24927L9.5 10.5L6.28097 12.0061C5.72532 12.2832 5.12089 12.4992 4.5 12.5H1V17H5.12749C5.92577 16.9991 6.71299 16.8133 7.42743 16.4571L12 14.5C12.5556 14.223 13.3792 14.0008 14 14L17 13.9939V8H14C13.3792 7.99916 13.0983 7.92246 12 7.5L8 5.99389H17V1ZM2 2H3V8H2V2ZM2 13.5H3V16H2V13.5ZM16 13H15V9H16V13ZM7.42743 6.36517L12 8.5C12.5419 8.76976 13.3984 8.93253 14 9V11.5H13.5C12.5 11.5 12.0556 11.277 11.5 11L6.5 8.5C5.78553 8.14368 5.50783 9 4.5 8.5L4 8V6H5C5.62089 6.00081 6.87178 6.08812 7.42743 6.36517ZM16 5H15V2H16V5Z"
        fill={fill}
        fillOpacity="0.4"
      />
      <path
        d="M3.5 8.5H1.5V1.5H3.5V5.5M3.5 8.5C4.5 8.5 6.5 8.5 9 10C12.4567 12.074 12 12 14.5 12M3.5 8.5V5.5M14.5 12V13.5H16.5V8.5H14.5M14.5 12V8.5M14.5 8.5C12.5 8.5 11.1 7.8 9.5 7C7.9 6.2 6.5 5.5 3.5 5.5"
        stroke={fill}
        fill={fill}
        strokeOpacity="1"
        fillOpacity="1"
      />
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
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
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
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
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
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
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

export function SquareAddonIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
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

export function BookIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M6 12.5H15.2541C15.539 12.5 15.7993 12.6614 15.9259 12.9166C15.9663 12.998 15.9908 13.0843 16 13.1716V1.75C16 1.33579 15.6642 1 15.25 1H6V12.5Z"
          fill={secondaryfill}
          fillOpacity="0.2"
        />
        <path
          d="M15.2541 12.5C15.539 12.5 15.7993 12.6614 15.9259 12.9166C16.0526 13.1718 16.0237 13.4767 15.8514 13.7036C15.3938 14.306 15.3376 15.1345 15.8442 15.7924C16.0186 16.0188 16.0492 16.3247 15.923 16.5811C15.7968 16.8376 15.5359 17 15.25 17H4.25C3.00736 17 2 15.9926 2 14.75C2 13.5074 3.00736 12.5 4.25 12.5H15.2541Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
        <path
          d="M8.75 5.25C8.75 4.83579 9.08579 4.5 9.5 4.5H13C13.4142 4.5 13.75 4.83579 13.75 5.25C13.75 5.66421 13.4142 6 13 6H9.5C9.08579 6 8.75 5.66421 8.75 5.25Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M8.75 8.25C8.75 7.83579 9.08579 7.5 9.5 7.5H13C13.4142 7.5 13.75 7.83579 13.75 8.25C13.75 8.66421 13.4142 9 13 9H9.5C9.08579 9 8.75 8.66421 8.75 8.25Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M6 1V12.5H4.25C3.00736 12.5 2 13.5074 2 14.75V3.75C2 2.23079 3.23079 1 4.75 1H6Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export function GithubIcon({
  fill = "currentColor",
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path d="M16,2.345c7.735,0,14,6.265,14,14-.002,6.015-3.839,11.359-9.537,13.282-.7,.14-.963-.298-.963-.665,0-.473,.018-1.978,.018-3.85,0-1.312-.437-2.152-.945-2.59,3.115-.35,6.388-1.54,6.388-6.912,0-1.54-.543-2.783-1.435-3.762,.14-.35,.63-1.785-.14-3.71,0,0-1.173-.385-3.85,1.435-1.12-.315-2.31-.472-3.5-.472s-2.38,.157-3.5,.472c-2.677-1.802-3.85-1.435-3.85-1.435-.77,1.925-.28,3.36-.14,3.71-.892,.98-1.435,2.24-1.435,3.762,0,5.355,3.255,6.563,6.37,6.913-.403,.35-.77,.963-.893,1.872-.805,.368-2.818,.963-4.077-1.155-.263-.42-1.05-1.452-2.152-1.435-1.173,.018-.472,.665,.017,.927,.595,.332,1.277,1.575,1.435,1.978,.28,.787,1.19,2.293,4.707,1.645,0,1.173,.018,2.275,.018,2.607,0,.368-.263,.787-.963,.665-5.719-1.904-9.576-7.255-9.573-13.283,0-7.735,6.265-14,14-14Z" />
      </g>
    </svg>
  );
}

export function MoonIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M8.54419 1.47446C8.70875 1.73227 8.70028 2.06417 8.52278 2.31324C7.88003 3.21522 7.5 4.31129 7.5 5.49999C7.5 8.53778 9.96222 11 13 11C14.0509 11 15.029 10.7009 15.8667 10.1868C16.1275 10.0267 16.4594 10.0412 16.7053 10.2233C16.9513 10.4054 17.0619 10.7186 16.9848 11.0148C16.0904 14.4535 12.9735 17 9.25 17C4.83179 17 1.25 13.4182 1.25 8.99999C1.25 5.08453 4.06262 1.83365 7.77437 1.14073C8.07502 1.0846 8.37963 1.21666 8.54419 1.47446Z"
          fill={secondaryfill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export function SunIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M9.00009 3C9.41419 3 9.75009 2.6641 9.75009 2.25V0.75C9.75009 0.3359 9.41419 0 9.00009 0C8.58599 0 8.25009 0.3359 8.25009 0.75V2.25C8.25009 2.6641 8.58599 3 9.00009 3Z"
          fill={fill}
        />
        <path
          d="M13.773 4.97705C13.9649 4.97705 14.1568 4.90385 14.3033 4.75735L15.3643 3.69635C15.6573 3.40335 15.6573 2.92875 15.3643 2.63585C15.0713 2.34295 14.5967 2.34285 14.3038 2.63585L13.2428 3.69685C12.9498 3.98985 12.9498 4.46445 13.2428 4.75735C13.3893 4.90385 13.5811 4.97705 13.773 4.97705Z"
          fill={fill}
        />
        <path
          d="M17.2501 8.25H15.7501C15.336 8.25 15.0001 8.5859 15.0001 9C15.0001 9.4141 15.336 9.75 15.7501 9.75H17.2501C17.6642 9.75 18.0001 9.4141 18.0001 9C18.0001 8.5859 17.6642 8.25 17.2501 8.25Z"
          fill={fill}
        />
        <path
          d="M14.3033 13.2427C14.0103 12.9497 13.5357 12.9497 13.2428 13.2427C12.9499 13.5357 12.9498 14.0103 13.2428 14.3032L14.3038 15.3642C14.4503 15.5107 14.6422 15.5839 14.8341 15.5839C15.026 15.5839 15.2179 15.5107 15.3644 15.3642C15.6574 15.0712 15.6574 14.5966 15.3644 14.3037L14.3033 13.2427Z"
          fill={fill}
        />
        <path
          d="M9.00009 15C8.58599 15 8.25009 15.3359 8.25009 15.75V17.25C8.25009 17.6641 8.58599 18 9.00009 18C9.41419 18 9.75009 17.6641 9.75009 17.25V15.75C9.75009 15.3359 9.41419 15 9.00009 15Z"
          fill={fill}
        />
        <path
          d="M3.69689 13.2427L2.63589 14.3037C2.34289 14.5967 2.34289 15.0713 2.63589 15.3642C2.78239 15.5107 2.97429 15.5839 3.16619 15.5839C3.35809 15.5839 3.54999 15.5107 3.69649 15.3642L4.75749 14.3032C5.05049 14.0102 5.05049 13.5356 4.75749 13.2427C4.46449 12.9498 3.98979 12.9497 3.69689 13.2427Z"
          fill={fill}
        />
        <path
          d="M3.00009 9C3.00009 8.5859 2.66419 8.25 2.25009 8.25H0.750092C0.335992 8.25 9.15527e-05 8.5859 9.15527e-05 9C9.15527e-05 9.4141 0.335992 9.75 0.750092 9.75H2.25009C2.66419 9.75 3.00009 9.4141 3.00009 9Z"
          fill={fill}
        />
        <path
          d="M3.6969 4.75727C3.8434 4.90377 4.0353 4.97697 4.2272 4.97697C4.4191 4.97697 4.611 4.90377 4.7575 4.75727C5.0505 4.46427 5.0505 3.98967 4.7575 3.69677L3.6965 2.63577C3.4035 2.34277 2.9289 2.34277 2.636 2.63577C2.3431 2.92877 2.343 3.40337 2.636 3.69627L3.6969 4.75727Z"
          fill={fill}
        />
        <path
          d="M9.00009 14C11.7615 14 14.0001 11.7614 14.0001 9C14.0001 6.23858 11.7615 4 9.00009 4C6.23867 4 4.00009 6.23858 4.00009 9C4.00009 11.7614 6.23867 14 9.00009 14Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export function SidebarLeft({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M14.2501 15.5H3.75012C2.23352 15.5 1.00012 14.2666 1.00012 12.75V5.25C1.00012 3.7334 2.23352 2.5 3.75012 2.5H14.2501C15.7667 2.5 17.0001 3.7334 17.0001 5.25V12.75C17.0001 14.2666 15.7667 15.5 14.2501 15.5Z"
          fill={secondaryfill}
          opacity="0.4"
        />
        <path
          d="M6.25012 4.5H3.75012C3.33591 4.5 3.00012 4.83579 3.00012 5.25V12.75C3.00012 13.1642 3.33591 13.5 3.75012 13.5H6.25012C6.66434 13.5 7.00012 13.1642 7.00012 12.75V5.25C7.00012 4.83579 6.66434 4.5 6.25012 4.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export function ThumbsUpIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M16.811 9.4546C17.0627 8.5026 16.7973 7.50479 16.0836 6.79069C15.5494 6.25619 14.7945 6.00059 14.0388 6.00059H10.4705L11.3571 3.24719C11.7056 2.19469 11.2901 1.41069 10.8725 0.93339C10.5807 0.59999 10.0531 0.621588 9.7635 0.956888L5.6683 5.6985C5.2372 6.1976 5 6.8352 5 7.4947V13.2507C5 14.7695 6.2312 16.0007 7.75 16.0007H12.961C14.2086 16.0007 15.2998 15.1607 15.619 13.9547L16.81 9.45469L16.811 9.4546Z"
          fill={secondaryfill}
          opacity="0.4"
        />
        <path
          d="M5.5 7.7506V14.2506C5.5 15.2156 4.715 16.0006 3.75 16.0006H2.75C1.785 16.0006 1 15.2156 1 14.2506V7.7506C1 6.7856 1.785 6.0006 2.75 6.0006H3.75C4.715 6.0006 5.5 6.7856 5.5 7.7506Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export function ThumbsDownIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M16.81 8.54671L15.619 4.04671C15.2998 2.84071 14.2086 2.0007 12.961 2.0007H7.75C6.2312 2.0007 5 3.2319 5 4.7507V10.5067C5 11.1662 5.2372 11.8037 5.6683 12.3029L9.76349 17.0445C10.0531 17.3798 10.5808 17.4014 10.8725 17.068C11.2902 16.5907 11.7056 15.8066 11.3571 14.7542L10.4705 12.0008H14.0388C14.7945 12.0008 15.5493 11.7452 16.0836 11.2107C16.7973 10.4966 17.0627 9.4988 16.811 8.5468L16.81 8.54671Z"
          fill={secondaryfill}
          opacity="0.4"
        />
        <path
          d="M3.75 12.0007H2.75C1.785 12.0007 1 11.2157 1 10.2507V3.7507C1 2.7857 1.785 2.0007 2.75 2.0007H3.75C4.715 2.0007 5.5 2.7857 5.5 3.7507V10.2507C5.5 11.2157 4.715 12.0007 3.75 12.0007Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export function CopyIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M11.75 14.5H4.25C3.5605 14.5 3 13.9395 3 13.25V6.75C3 6.3359 2.6641 6 2.25 6C1.8359 6 1.5 6.3359 1.5 6.75V13.25C1.5 14.7666 2.7334 16 4.25 16H11.75C12.1641 16 12.5 15.6641 12.5 15.25C12.5 14.8359 12.1641 14.5 11.75 14.5Z"
          fill={secondaryfill}
          opacity="0.4"
        />
        <path
          d="M13.75 2H7.25C5.73122 2 4.5 3.23122 4.5 4.75V10.25C4.5 11.7688 5.73122 13 7.25 13H13.75C15.2688 13 16.5 11.7688 16.5 10.25V4.75C16.5 3.23122 15.2688 2 13.75 2Z"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

export function CheckIcon({
  fill = "currentColor",
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  return (
    <svg
      height={height}
      width={width}
      viewBox="-1 -2 20 20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M6.5001 14C6.3077 14 6.1163 13.9268 5.9698 13.7803L2.21981 10.0303C1.92681 9.7373 1.92681 9.2627 2.21981 8.9698C2.51281 8.6769 2.98741 8.6768 3.28031 8.9698L6.50001 12.1895L14.7197 3.9698C15.0127 3.6768 15.4873 3.6768 15.7802 3.9698C16.0731 4.2628 16.0732 4.7374 15.7802 5.0303L7.03022 13.7803C6.88372 13.9268 6.6925 14 6.5001 14Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export function NpmIcon({
  fill = "currentColor",
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="m7.415 7.656 17.291.024-.011 17.29h-4.329l.012-12.974h-4.319l-.01 12.964H7.393zM3.207 1.004h-.005a2.2 2.2 0 0 0-2.198 2.198v25.596c0 1.214.984 2.198 2.198 2.198h25.596a2.2 2.2 0 0 0 2.198-2.198V3.202a2.2 2.2 0 0 0-2.198-2.198h-.006z"
        fill={fill}
      />
    </svg>
  );
}

export function YarnIcon({
  fill = "currentColor",
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M28.208 24.409a10.5 10.5 0 0 0-3.959 1.822 23.7 23.7 0 0 1-5.835 2.642 1.63 1.63 0 0 1-.983.55 62 62 0 0 1-6.447.577c-1.163.009-1.876-.3-2.074-.776a1.573 1.573 0 0 1 .866-2.074 4 4 0 0 1-.514-.379c-.171-.171-.352-.514-.406-.388-.225.55-.343 1.894-.947 2.5-.83.839-2.4.559-3.328.072-1.019-.541.072-1.813.072-1.813a.73.73 0 0 1-.992-.343 4.85 4.85 0 0 1-.667-2.949 5.37 5.37 0 0 1 1.749-2.895 9.3 9.3 0 0 1 .658-4.4 10.45 10.45 0 0 1 3.165-3.661S6.628 10.747 7.35 8.817c.469-1.262.658-1.253.812-1.308a3.6 3.6 0 0 0 1.452-.857 5.27 5.27 0 0 1 4.41-1.7S15.2 1.4 16.277 2.09a18.4 18.4 0 0 1 1.533 2.886s1.281-.748 1.425-.469a11.33 11.33 0 0 1 .523 6.132 14 14 0 0 1-2.6 5.411c-.135.225 1.551.938 2.615 3.887.983 2.7.108 4.96.262 5.212.027.045.036.063.036.063s1.127.09 3.391-1.308a8.5 8.5 0 0 1 4.277-1.604 1.081 1.081 0 0 1 .469 2.11Z"
        fill={fill}
      />
    </svg>
  );
}

export function BunIcon({
  fill = "currentColor",
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 32 32"
      {...props}
    >
      <path
        fill={fill}
        d="M29 17c0 5.65-5.82 10.23-13 10.23S3 22.61 3 17c0-3.5 2.24-6.6 5.66-8.44S14.21 4.81 16 4.81s3.32 1.54 7.34 3.71C26.76 10.36 29 13.46 29 17"
      />
      <path
        fill="none"
        stroke={fill}
        d="M16 27.65c7.32 0 13.46-4.65 13.46-10.65 0-3.72-2.37-7-5.89-8.85-1.39-.75-2.46-1.41-3.37-2l-1.13-.69A6.14 6.14 0 0 0 16 4.35a6.9 6.9 0 0 0-3.3 1.23c-.42.24-.86.51-1.32.8-.87.54-1.83 1.13-3 1.73C4.91 10 2.54 13.24 2.54 17c0 6 6.14 10.65 13.46 10.65Z"
      />
      <ellipse cx="21.65" cy="18.62" fill={fill} rx="2.17" ry="1.28" />
      <ellipse cx="10.41" cy="18.62" fill={fill} rx="2.17" ry="1.28" />
      <path
        fillRule="evenodd"
        d="M11.43 18.11a2 2 0 1 0-2-2.05 2.05 2.05 0 0 0 2 2.05m9.2 0a2 2 0 1 0-2-2.05 2 2 0 0 0 2 2.05"
      />
      <path
        fill={fill}
        fillRule="evenodd"
        d="M10.79 16.19a.77.77 0 1 0-.76-.77.76.76 0 0 0 .76.77m9.2 0a.77.77 0 1 0 0-1.53.77.77 0 0 0 0 1.53"
      />
      <path
        fill={fill}
        stroke={fill}
        strokeWidth=".75"
        d="M18.62 19.67a3.3 3.3 0 0 1-1.09 1.75 2.48 2.48 0 0 1-1.5.69 2.53 2.53 0 0 1-1.5-.69 3.28 3.28 0 0 1-1.08-1.75.26.26 0 0 1 .29-.3h4.58a.27.27 0 0 1 .3.3Z"
      />
      <path
        fill={fill}
        fillRule="evenodd"
        d="M14.93 5.75a6.1 6.1 0 0 1-2.09 4.62c-.1.09 0 .27.11.22 1.25-.49 2.94-1.94 2.23-4.88-.03-.15-.25-.11-.25.04m.85 0a6 6 0 0 1 .57 5c0 .13.12.24.21.13.83-1 1.54-3.11-.59-5.31-.1-.11-.27.04-.19.17Zm1-.06a6.1 6.1 0 0 1 2.53 4.38c0 .14.21.17.24 0 .34-1.3.15-3.51-2.66-4.66-.12-.02-.21.18-.09.27ZM9.94 9.55a6.27 6.27 0 0 0 3.89-3.33c.07-.13.28-.08.25.07-.64 3-2.79 3.59-4.13 3.51-.14-.01-.14-.21-.01-.25"
      />
    </svg>
  );
}

export function PnpmIcon({
  fill = "currentColor",
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 32 32"
      {...props}
    >
      <path
        d="M30 10.75h-8.749V2H30Zm-9.626 0h-8.75V2h8.75Zm-9.625 0H2V2h8.749ZM30 20.375h-8.749v-8.75H30Z"
        fill={fill}
      />
      <path
        d="M20.374 20.375h-8.75v-8.75h8.75Zm0 9.625h-8.75v-8.75h8.75ZM30 30h-8.749v-8.75H30Zm-19.251 0H2v-8.75h8.749Z"
        fill={fill}
        opacity="0.4"
      />
    </svg>
  );
}

export function InfoIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M9 16.25C13.0041 16.25 16.25 13.004 16.25 9C16.25 4.996 13.0041 1.75 9 1.75C4.9959 1.75 1.75 4.996 1.75 9C1.75 13.004 4.9959 16.25 9 16.25Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 5.431V9.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 13.417C8.448 13.417 8 12.968 8 12.417C8 11.866 8.448 11.417 9 11.417C9.552 11.417 10 11.866 10 12.417C10 12.968 9.552 13.417 9 13.417Z"
          fill={secondaryfill}
          stroke="none"
        />
      </g>
    </svg>
  );
}

export function WarningIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M7.63796 3.48996L2.21295 12.89C1.60795 13.9399 2.36395 15.25 3.57495 15.25H14.425C15.636 15.25 16.392 13.9399 15.787 12.89L10.362 3.48996C9.75696 2.44996 8.24296 2.44996 7.63796 3.48996Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 6.75V9.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 13.5C8.448 13.5 8 13.05 8 12.5C8 11.95 8.448 11.5 9 11.5C9.552 11.5 10 11.9501 10 12.5C10 13.0499 9.552 13.5 9 13.5Z"
          fill={secondaryfill}
          stroke="none"
        />
      </g>
    </svg>
  );
}

export function AlertIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M13.25 2.75H4.75C3.6454 2.75 2.75 3.65 2.75 4.75V13.25C2.75 14.35 3.6454 15.25 4.75 15.25H13.25C14.3546 15.25 15.25 14.35 15.25 13.25V4.75C15.25 3.65 14.3546 2.75 13.25 2.75Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 5.43103V9.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 13.417C8.448 13.417 8 12.968 8 12.417C8 11.866 8.448 11.417 9 11.417C9.552 11.417 10 11.866 10 12.417C10 12.968 9.552 13.417 9 13.417Z"
          fill={secondaryfill}
          stroke="none"
        />
      </g>
    </svg>
  );
}

export function CheckboxCheckedIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <rect
          height="9.5"
          width="9.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
          x="1.25"
          y="1.25"
        />
        <polyline
          fill="none"
          points="3.747 6.5 5.25 8 8.253 4"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}

export function BackgroundIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M10.7803 2.21967C11.0732 2.51256 11.0732 2.98744 10.7803 3.28033L3.28033 10.7803C2.98744 11.0732 2.51256 11.0732 2.21967 10.7803C1.92678 10.4874 1.92678 10.0126 2.21967 9.71967L9.71967 2.21967C10.0126 1.92678 10.4874 1.92678 10.7803 2.21967Z"
          fill={secondaryfill}
          fillOpacity="0.4"
          fillRule="evenodd"
        />
        <path
          d="M15.7803 7.21967C16.0732 7.51256 16.0732 7.98744 15.7803 8.28033L8.28033 15.7803C7.98744 16.0732 7.51256 16.0732 7.21967 15.7803C6.92678 15.4874 6.92678 15.0126 7.21967 14.7197L14.7197 7.21967C15.0126 6.92678 15.4874 6.92678 15.7803 7.21967Z"
          fill={secondaryfill}
          fillOpacity="0.4"
          fillRule="evenodd"
        />
        <path
          d="M15.7803 2.21967C16.0732 2.51256 16.0732 2.98744 15.7803 3.28033L3.28033 15.7803C2.98744 16.0732 2.51256 16.0732 2.21967 15.7803C1.92678 15.4874 1.92678 15.0126 2.21967 14.7197L14.7197 2.21967C15.0126 1.92678 15.4874 1.92678 15.7803 2.21967Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M5.78033 2.21967C6.07322 2.51256 6.07322 2.98744 5.78033 3.28033L3.28033 5.78033C2.98744 6.07322 2.51256 6.07322 2.21967 5.78033C1.92678 5.48744 1.92678 5.01256 2.21967 4.71967L4.71967 2.21967C5.01256 1.92678 5.48744 1.92678 5.78033 2.21967Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M15.7803 12.2197C16.0732 12.5126 16.0732 12.9874 15.7803 13.2803L13.2803 15.7803C12.9874 16.0732 12.5126 16.0732 12.2197 15.7803C11.9268 15.4874 11.9268 15.0126 12.2197 14.7197L14.7197 12.2197C15.0126 11.9268 15.4874 11.9268 15.7803 12.2197Z"
          fill={fill}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}

export function TooltipIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M7.5 8.25C7.5 7.00779 8.50779 6 9.75 6H14.75C15.9922 6 17 7.00779 17 8.25V12.25C17 13.4077 16.1247 14.3618 15 14.4863V16.25C15 16.5469 14.8249 16.8158 14.5534 16.9359C14.2819 17.056 13.9652 17.0046 13.7455 16.805L11.21 14.5H9.75C8.50779 14.5 7.5 13.4922 7.5 12.25L7.5 8.25Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M7 8.25C7 7.00779 8.00779 6 9.25 6H14.75C15.9922 6 17 7.00779 17 8.25V12.25C17 13.4077 16.1247 14.3618 15 14.4863V16.25C15 16.5469 14.8249 16.8158 14.5534 16.9359C14.2819 17.056 13.9652 17.0046 13.7455 16.805L11.21 14.5H9.25C8.00779 14.5 7 13.4922 7 12.25L7 8.25Z"
          fill={fill}
          fillRule="evenodd"
        />
        <path
          d="M1 4.25C1 2.73079 2.23079 1.5 3.75 1.5H10.2498C11.7686 1.5 12.9998 2.73122 12.9998 4.25V4.5H9.25C7.17936 4.5 5.5 6.17936 5.5 8.25V12.25C5.5 12.6113 5.55113 12.9607 5.64653 13.2913L4.30281 14.7569C4.09381 14.9848 3.7663 15.0611 3.47807 14.949C3.18984 14.8368 3 14.5593 3 14.25V11.8968C1.84586 11.5707 1 10.509 1 9.25101V4.25Z"
          fill={secondaryfill}
          fillOpacity="0.4"
        />
      </g>
    </svg>
  );
}

export function ChartLegendIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <rect
          height="4.5"
          width="4.5"
          fill={fill}
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="6.75"
          y="2"
        />
        <path
          d="m15.5,2h-1.5c-.8271,0-1.5.6729-1.5,1.5v1.5c0,.8271.6729,1.5,1.5,1.5h1.5c.8271,0,1.5-.6729,1.5-1.5v-1.5c0-.8271-.6729-1.5-1.5-1.5Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m5.5,5v-1.5c0-.8271-.6729-1.5-1.5-1.5h-1.5c-.8271,0-1.5.6729-1.5,1.5v1.5c0,.8271.6729,1.5,1.5,1.5h1.5c.8271,0,1.5-.6729,1.5-1.5Z"
          fill={secondaryfill}
          opacity=".4"
          strokeWidth="0"
        />
        <path
          d="m10.5586,8.0659l-6.854,2.5039c-.4307.1577-.7134.5713-.7041,1.0298s.3091.8604.7456,1l2.7686.8857.8857,2.7686c.1396.4365.5415.7363,1,.7456.0073.0005.0146.0005.022.0005.4497,0,.853-.2808,1.0078-.7046l2.5039-6.854c.1445-.3965.0493-.8281-.249-1.1265-.2983-.2988-.731-.3926-1.1265-.249Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export function ChartConfigIcon({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill={fill}>
        <path
          d="M17.3561 4.272L16.5641 4.18411L16.2001 3.3049L16.6981 2.68311C16.9281 2.39501 16.9051 1.97999 16.6451 1.71899L16.2811 1.35501C16.0201 1.09401 15.6051 1.0711 15.3171 1.302L14.6951 1.79999L13.8161 1.436L13.7281 0.644012C13.6871 0.276812 13.3771 0 13.0081 0H12.4921C12.1231 0 11.8131 0.276912 11.7721 0.644012L11.6841 1.436L10.8051 1.79999L10.1831 1.302C9.8951 1.071 9.48008 1.09401 9.21908 1.35501L8.8551 1.71899C8.5951 1.97999 8.57209 2.39501 8.80209 2.68311C8.80209 2.68311 8.9942 2.9157 9.3001 3.3049C9.606 3.6941 9.6484 4.02541 9.7355 4.38821C10.1203 4.15281 10.5675 4.02539 11.0216 4.02539C11.2715 4.02539 11.5117 4.0735 11.7437 4.1445C12.0102 3.9018 12.3612 3.75 12.7501 3.75C13.5785 3.75 14.2501 4.4216 14.2501 5.25C14.2501 5.6355 14.1006 5.9834 13.8615 6.2493C14.0668 6.9129 13.9896 7.64751 13.6124 8.26221C13.9757 8.34981 14.3141 8.39489 14.6951 8.69989L15.3171 9.19791C15.6051 9.42891 16.0201 9.4059 16.2811 9.1449L16.6451 8.78091C16.9051 8.51991 16.9281 8.1049 16.6981 7.8168L16.2001 7.19501L16.5641 6.3158L17.3561 6.22791C17.7231 6.18691 18.0001 5.8768 18.0001 5.5079V4.99179C18.0001 4.62289 17.7231 4.313 17.3561 4.272Z"
          fill={secondaryfill}
          opacity="0.4"
        />
        <path
          d="M13.1391 9.69901L12.0831 9.58209L11.5981 8.41L12.2621 7.5802C12.569 7.1962 12.5391 6.6422 12.1901 6.2941L11.7051 5.8092C11.3571 5.4601 10.8031 5.43001 10.4191 5.73721L9.5891 6.401L8.41609 5.91611L8.29808 4.85989C8.24308 4.37019 7.83009 4.00101 7.33809 4.00101H6.66008C6.16818 4.00101 5.75509 4.37109 5.70009 4.85989L5.58208 5.91611L4.40907 6.401L3.57909 5.73721C3.19509 5.43011 2.64108 5.4601 2.29318 5.8092L1.80818 6.2941C1.46018 6.6422 1.42919 7.1962 1.73619 7.5802L2.40019 8.41L1.91519 9.58209L0.859192 9.69901C0.369192 9.75391 0.000183105 10.168 0.000183105 10.659V11.3441C0.000183105 11.836 0.370192 12.2491 0.859192 12.3041L1.91519 12.421L2.40019 13.5931L1.73619 14.4229C1.42919 14.8072 1.45918 15.3609 1.80818 15.709L2.29318 16.1939C2.64118 16.543 3.19519 16.5731 3.57909 16.2662L4.40907 15.6021L5.58208 16.087L5.70009 17.1432C5.75509 17.6332 6.16808 18.0021 6.66008 18.0021H7.33809C7.83009 18.0021 8.24308 17.632 8.29808 17.1432L8.41609 16.087L9.5891 15.6021L10.4191 16.2662C10.8031 16.5731 11.3571 16.5431 11.7051 16.1939L12.1901 15.709C12.5381 15.3609 12.5691 14.8071 12.2621 14.4229L11.5981 13.5931L12.0831 12.421L13.1391 12.3041C13.6292 12.2492 13.9981 11.8351 13.9981 11.3441V10.659C13.9981 10.1671 13.6281 9.75401 13.1391 9.69901ZM7.00008 13C5.89548 13 5.00008 12.1045 5.00008 11C5.00008 9.8955 5.89548 9 7.00008 9C8.10468 9 9.00008 9.8955 9.00008 11C9.00008 12.1045 8.10468 13 7.00008 13Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}
