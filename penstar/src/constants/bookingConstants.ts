export const CHILD_AGE_LIMIT = 8; 
export const getGuestType = (age: number): "adult" | "child" => {
  return age >= CHILD_AGE_LIMIT ? "adult" : "child";
};
export const isValidChildAge = (age: number): boolean => {
  return age >= 0 && age < CHILD_AGE_LIMIT;
};
export const isValidAdultAge = (age: number): boolean => {
  return age >= CHILD_AGE_LIMIT && age <= 120;
};
