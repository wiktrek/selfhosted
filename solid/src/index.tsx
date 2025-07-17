/* @refresh reload */
import "../styles/global.css";
import { render, style } from "solid-js/web";
const root = document.getElementById("root");
const Home = () => {
  const grid_size = 9;
  let is_apple = false;
  const Grid = (props: { size: number }) => {
    let elements = [];
    for (let index = 0; index < props.size ** 2; index++) {
      elements.push(index);
    }
    return (
      <>
        {elements.map((i) => (
          <div
            class="border-2 w-16 h-16"
            style={{
              "background-color": "lightgreen",
            }}
            id={`${i}`}
          />
        ))}
      </>
    );
  };
  function spawn_snake() {
    document.getElementById("0")!.style.backgroundColor = "green";
    if (!is_apple) {
      spawn_apple();
    }
  }
  function spawn_apple() {
    let random = Math.random() * grid_size ** 2;
    let random_element = document.getElementById(`${Math.floor(random)}`)!;
    while (random_element.style.backgroundColor === "green") {
      random = Math.random() * grid_size ** 2;
      random_element = document.getElementById(`${Math.floor(random)}`)!;
    }
    random_element.style.backgroundColor = "red";
    is_apple = true;
  }
  return (
    <>
      <div class="flex justify-center text-center items-center text-3xl flex-col bg-slate-800 h-screen text-white">
        <h1>This is a snake app!</h1>
        <button onClick={spawn_snake}>Start</button>
        <div class="grid grid-cols-9 grid-rows-9 pt-4">
          <Grid size={grid_size} />
        </div>
      </div>
    </>
  );
};
render(() => <Home />, root!);
