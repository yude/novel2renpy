import Head from 'next/head'
import { stringify } from 'querystring';
import * as React from "react"
import { useState } from "react"
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import styles from '../styles/Home.module.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  let [value, setValue] = useState('');
  let [splitter, setSplitter] = useState('');
  let [temp, setTemp] = useState('aaaa');

  let [character, setCharacter] = useState([{ name: "ナレーション", renpy: "narrator" }])

  // define raw lines
  let lines: string[] = []

  // define parsed lines
  let parsed_lines_chara: string[] = []
  let parsed_lines_dialogue: string[] = []

  function updateCharacterRenPy(name: string, new_renpy: string) {
    const newCharacterState = character.map(obj => {
      if (obj.name === name) {
        return { ...obj, renpy: new_renpy }
      }
      return obj
    })

    setCharacter(newCharacterState)
  }

  React.useEffect(() => {
    let temp2: string = value
    let render_lines: string = ""
    temp2 = temp2.replace(/\t/d, '')
    temp2 = temp2.replace(/\u3000/g, '')
    temp2 = temp2.replace(/	/g, '')
    lines = temp2.split('\n')

    // reset variables
    parsed_lines_chara = []
    parsed_lines_dialogue = []

    // parse lines
    temp2 = ""
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] != "") {
        if (lines[i].includes("「")) {
          let position_split = lines[i].indexOf('「')
          parsed_lines_chara.push(lines[i].slice(0, position_split))
          parsed_lines_dialogue.push(lines[i].slice(position_split))
          temp2 += lines[i] + "\n"
        } else {
          parsed_lines_chara.push("ナレーション")
          parsed_lines_dialogue.push(lines[i])
          temp2 += lines[i] + "\n"
        }
      }
    }

    let character_list = Array.from(new Set(parsed_lines_chara))
    character_list = character_list.filter(function (e) { return e !== 'ナレーション' })
    character_list = character_list.filter(function (e) { return e !== '' })

    for (let i = 0; i < character_list.length; i++) {
      const index = character.findIndex((item) => item.name === character_list[i])
      if (index == -1) {
        setCharacter(
          (p) => ([
            ...p,
            {
              name: character_list[i],
              renpy: "",
              index: character.indexOf(character.filter(obj => obj.name == character_list[i])[0])
            }
          ])
        )
      }
    }

    // render lines
    for (let i = 0; i < parsed_lines_chara.length; i++) {
      const splitters = splitter.split('')
      let isComment: boolean = false
      for (let j = 0; j < splitters.length; j++) {
        if (lines[i].includes(splitters[j])) {
          isComment = true
          break
        }
      }

      if (isComment) {
        render_lines += "# " + lines[i] + "\n"
      } else {
        // retrieve character name
        if (parsed_lines_chara[i] === "") {
          const filtered = character.filter(obj => {
            return obj.name === "ナレーション"
          })
          if (filtered[0].renpy === "") {
            render_lines += filtered[0].name
          } else {
            render_lines += filtered[0].renpy
          }
        } else {
          const filtered = character.filter(obj => obj.name == parsed_lines_chara[i])
          if (filtered[0]) {
            if (filtered[0].renpy === "") {
              render_lines += filtered[0].name
            } else {
              render_lines += filtered[0].renpy
            }
          }
        }

        // retrieve dialogue
        render_lines += " \""
        render_lines += parsed_lines_dialogue[i]
        render_lines += "\""
        render_lines += "\n"
      }
    }
    setTemp(render_lines)
  }, [value, character, splitter])

  return (
    <div className={styles.container}>
      <Head>
        <title>novel2renpy</title>
        <meta name="description" content="novel2renpy: ノベルゲームの原稿を Ren'Py のソースコードに変換します。" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h3 className="mt-5">novel2renpy</h3>
        <h6>ノベルゲームの原稿を Ren'Py のソースコードに変換します。</h6>
        <div className="container mt-5">
          <div className="row">
            <div className="col-6">
              <Form.Control type="email" placeholder="ここに原稿を入力 または ペースト..." as="textarea" onChange={(event) => setValue(event.target.value)} rows={30} />
            </div>
            <div className="col-6">
              <Form.Control value={temp} disabled placeholder="ここに変換済みのソースコードが表示されます。" as="textarea" rows={30} />
              <Button variant="primary" className="mt-2" onClick={() => { navigator.clipboard.writeText(temp) }}><FontAwesomeIcon icon={faClipboard} width={20} height={20} /> コピーする</Button>
            </div>
          </div>
        </div>
        <div className="container mt-4">
          <Form.Label>コメントとして解釈する行の設定</Form.Label>
          <Form.Text className="text-muted">
            &nbsp;次の文字 (記号) が含まれている行は、コメントとして解釈します。
          </Form.Text>
          <Form.Control onChange={(event) => setSplitter(event.target.value)} placeholder="連続して入力することで、複数個指定できます。(例: *＊#)" />
          <Form.Label className="mt-3">キャラクター名と Ren'Py 内のキャラクター定義の対応の設定</Form.Label>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>キャラクター名</th>
                <th>Ren'Py コード内での定義</th>
              </tr>
            </thead>
            <tbody>
              {character.map((obj, index) => {
                return (
                  <tr key={index}>
                    <td>{obj.name}</td>
                    <td><Form.Control placeholder={obj.name} onChange={(event) => updateCharacterRenPy(obj.name, event.target.value)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </Table>

          <hr />
          <p>&copy; 2022 yude &lt;i[at]yude.jp&gt;. / <a href="https://github.com/yude/novel2renpy/blob/master/LICENSE">MIT License</a>. / GitHub: <a href="https://github.com/yude/novel2renpy">yude/novel2renpy</a></p>
        </div>
      </main>
    </div>
  )
}
