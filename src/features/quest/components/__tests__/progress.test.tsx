import { render } from "@testing-library/react";
import { Progress } from "@/features/quest/components/ui/progress";

test("Progress clamps the fill width to 0-100%", () => {
  const { getByTestId, rerender } = render(<Progress value={150} />);
  expect(getByTestId("quest-progress-fill")).toHaveStyle({ width: "100%" });
  rerender(<Progress value={-20} />);
  expect(getByTestId("quest-progress-fill")).toHaveStyle({ width: "0%" });
  rerender(<Progress value={42} />);
  expect(getByTestId("quest-progress-fill")).toHaveStyle({ width: "42%" });
});
