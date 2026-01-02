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
