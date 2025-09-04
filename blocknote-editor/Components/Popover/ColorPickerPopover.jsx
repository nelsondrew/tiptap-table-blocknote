import React from 'react';
import styled from 'styled-components';

const AnimatedPopover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 184px;
  background: white;
  /* border: 1px solid #e5e7eb; */
  border-radius: 4px;
  /* box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.08); */
  box-shadow: 0px 0px 60px 0px #00000014;
  padding: 16px;
  padding-bottom: 0px;
  z-index: 200;

  opacity: ${props => (props.show ? 1 : 0)};
  transform: translateY(${props => (props.show ? '0px' : '-10px')});
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: ${props => (props.show ? 'auto' : 'none')};
`;

const Section = styled.div`
  margin-bottom: 14px;
`;

const Title = styled.div`
  color: #666666;
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 1%;
  vertical-align: middle;
  margin-bottom: 8px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`;

const Swatch = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid ${props => props.color === '#ffffff' ? '#f2f2f2' : props.color};
  background-color: ${props => props.color};
  cursor: pointer;

  &:hover {
    outline: 2px solid ${props => props.color === '#ffffff' ? '#f2f2f2' : props.color};
  }
`;

const ColorA = styled.button`
  background: transparent;
  border: 1px solid #f2f2f2;
  border-radius: 4px;
  font-size: 14px;
  width: 24px;
  height: 24px;
  text-align: center;
  color: ${props => props.color};
  cursor: pointer;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const RecentRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const ColorPickerPopover = ({
  show,
  textColor,
  highlightColor,
  onTextColorSelect,
  onHighlightColorSelect,
}) => {
  const textColors = [
    { label: 'Black', value: '#000' },
    { label: 'Gray', value: '#9c9c9c' },
    { label: 'Brown', value: '#864426' },
    { label: 'Red', value: '#e42121' },
    { label: 'Orange', value: '#ff7333' },
    { label: 'Yellow', value: '#f49e3a' },
    { label: 'Green', value: '#11ab45' },
    { label: 'Blue', value: '#207fff' },
    { label: 'Purple', value: '#795fe1' },
    { label: 'Pink', value: '#ef69a2' },
  ];

  const backgroundColors = [
    { label: 'Unset', value: 'unset-color' },
    { label: 'Gray', value: 'rgba(156, 156, 156, 0.2)'},
    { label: 'steelbrown', value: 'rgba(134, 68, 38, 0.2)'},
    { label: 'fadedred', value: 'rgba(228, 33, 33, 0.2)'},
    { label: 'fadedorange', value: 'rgba(255, 115, 51, 0.2)' },
    { label: 'paleyellow', value: 'rgba(244, 158, 58, 0.2)' },
    { label: 'mintgreen', value: 'rgba(17, 171, 69, 0.2)' },
    { label: 'skyblue', value: 'rgba(32, 127, 255, 0.2)' },
    { label: 'lilacpurple', value: 'rgba(121, 95, 225, 0.2)' },
    { label: 'babypink', value: 'rgba(239, 105, 162, 0.2)' },
  ];

  return (
    <AnimatedPopover show={show}>
      <Section>
        <Title>Recently Used</Title>
        <RecentRow>
            <ColorA color={textColor} onMouseDown={(e) => { e.preventDefault(); onTextColorSelect(textColor); }}>A</ColorA>
            <Swatch
                color={highlightColor === 'unset-color' ? '#fff' : highlightColor}
                  onMouseDown={(e) => {
                  e.preventDefault();
                  onHighlightColorSelect(highlightColor);
                }}
            />
        </RecentRow>
      </Section>

      <Section>
        <Title>Text</Title>
        <Grid>
          {textColors.map(({ value }) => (
            <ColorA
              key={value}
              color={value}
              onMouseDown={(e) => {
              e.preventDefault();
              onTextColorSelect(value);
            }}
             >
              A
            </ColorA>
          ))}
        </Grid>
      </Section>

      <Section>
        <Title>Background</Title>
        <Grid>
          {backgroundColors.map(({ value }) => (
            <Swatch
              key={value}
              color={value === 'unset-color' ? '#ffffff' : value}
              onMouseDown={(e) => {
                e.preventDefault();
                onHighlightColorSelect(value);
              }}
            />
          ))}
        </Grid>
      </Section>
    </AnimatedPopover>
  );
};
