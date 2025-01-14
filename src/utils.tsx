import React from 'react';

import { Section } from './beans';
import { DAYS, PALETTE } from './constants';
import { Period, PrerequisiteClause } from './types';

export const stringToTime = (string: string): number => {
  const regexResult = /(\d{1,2}):(\d{2}) (a|p)m/.exec(string);
  if (regexResult === null) return 0;
  const [, hour, minute, ampm] = (regexResult as unknown) as [
    string,
    string,
    string,
    string
  ];
  return ((ampm === 'p' ? 12 : 0) + (+hour % 12)) * 60 + +minute;
};

export const timeToString = (time: number, ampm = true): string => {
  const hour = (time / 60) | 0;
  const minute = time % 60;
  const hh = hour > 12 ? hour - 12 : hour;
  const mm = `${minute}`.padStart(2, '0');
  const A = `${hour < 12 ? 'a' : 'p'}m`;
  return ampm ? `${hh}:${mm} ${A}` : `${hh}:${mm}`;
};

export const timeToShortString = (time: number): string => {
  const hour = (time / 60) | 0;
  return `${hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}m`;
};

export const periodToString = (period: Period | undefined): string =>
  period != null
    ? `${timeToString(period.start, false)} - ${timeToString(period.end)}`
    : 'TBA';

export const getRandomColor = (): string => {
  const colors = PALETTE.flat();
  const index = (Math.random() * colors.length) | 0;
  return colors[index] ?? '#333333';
};

export const getContentClassName = (color: string | undefined): string => {
  if (color == null) return 'light-content';
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 128
    ? 'light-content'
    : 'dark-content';
};

export const hasConflictBetween = (
  section1: Section,
  section2: Section
): boolean =>
  section1.meetings.some((meeting1) =>
    section2.meetings.some(
      (meeting2) =>
        meeting1.period &&
        meeting2.period &&
        DAYS.some(
          (day) => meeting1.days.includes(day) && meeting2.days.includes(day)
        ) &&
        meeting1.period.start < meeting2.period.end &&
        meeting2.period.start < meeting1.period.end
    )
  );

export const classes = (
  ...classList: (string | boolean | null | undefined)[]
): string => classList.filter((c) => c).join(' ');

export const isMobile = (): boolean => window.innerWidth < 1024;

export const simplifyName = (name: string): string => {
  const tokens = name.split(' ');
  const firstName = tokens.shift();
  const lastName = tokens.pop();
  return [firstName, lastName].join(' ');
};

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export const isLab = (section: Section): boolean =>
  ['Lab', 'Studio'].some((type) => section.scheduleType.includes(type));

export const isLecture = (section: Section): boolean =>
  section.scheduleType.includes('Lecture');

export const getSemesterName = (term: string): string => {
  const year = term.substring(0, 4);
  const semester = ((): string => {
    switch (Number.parseInt(term.substring(4), 10)) {
      case 1:
        return 'Winter';
      case 2:
      case 3:
        return 'Spring';
      case 5:
      case 6:
        return 'Summer';
      case 8:
      case 9:
        return 'Fall';
      default:
        return 'Unknown';
    }
  })();
  return `${semester} ${year}`;
};

export function humanizeArray<T>(array: T[], conjunction = 'and'): string {
  if (array.length <= 2) {
    return array.join(` ${conjunction} `);
  }
  const init = [...array];
  const last = init.pop();
  return `${init.join(', ')}, ${conjunction} ${String(last)}`;
}

export function humanizeArrayReact<T>(
  array: T[],
  conjunction: React.ReactNode = 'and'
): React.ReactNode {
  if (array.length === 0) {
    return null;
  }
  if (array.length === 1) {
    return String(array[0]);
  }
  if (array.length === 2) {
    return (
      <>
        {String(array[0])} {conjunction} {String(array[1])}
      </>
    );
  }

  const init = [...array];
  const last = init.pop();
  return (
    <>
      {`${init.join(', ')},`.trim()} {conjunction} {String(last)}
    </>
  );
}

export const serializePrereqs = (
  reqs: PrerequisiteClause,
  openPar = false,
  closePar = false
): string => {
  // This function accepts the index of a sub-clause
  // from the sub-clause slice of a compound prereq clause
  // (i.e. the [...sub-clauses] part of a clause
  // that itself is of the form [operator, ...sub-clauses]).
  // As such, we compare to the clause length - 2
  // (since the sub-clauses[0] is really reqs[1])
  const last = (i: number): boolean =>
    Array.isArray(reqs) && i === reqs.length - 2;
  let string = '';

  if (!Array.isArray(reqs)) {
    string += (openPar ? '(' : '') + reqs.id + (closePar ? ')' : '');
  } else if (reqs[0] === 'and') {
    const [, ...subClauses] = reqs;
    subClauses.forEach((req, i) => {
      string +=
        serializePrereqs(req, i === 0, last(i)) + (last(i) ? '' : ' and ');
    });
  } else if (reqs[0] === 'or') {
    const [, ...subClauses] = reqs;
    subClauses.forEach((req, i) => {
      string += serializePrereqs(req) + (last(i) ? '' : ' or ');
    });
  }

  return string;
};
